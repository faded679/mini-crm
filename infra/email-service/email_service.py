# -*- coding: utf-8 -*-
import smtplib
import imaplib
import email as email_lib
from email.header import decode_header
import os
import base64
import re
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.header import Header
from email import encoders
from flask import Flask, request, jsonify

app = Flask(__name__)

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.yandex.ru")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SENDER_EMAIL = os.environ.get("SMTP_USER", "expresssolo@yandex.ru")
APP_PASSWORD = os.environ.get("SMTP_PASS", "")
SENDER_NAME = os.environ.get("SMTP_FROM_NAME", "Соловьев-Экспресс")


def send_email(to: str, subject: str, html: str, attachment_b64: str = None, attachment_filename: str = None):
    msg = MIMEMultipart("mixed")
    msg["Subject"] = Header(subject, "utf-8").encode()
    msg["From"] = SENDER_EMAIL
    msg["To"] = to

    msg.attach(MIMEText(html, "html", "utf-8"))

    if attachment_b64 and attachment_filename:
        pdf_bytes = base64.b64decode(attachment_b64)
        part = MIMEBase("application", "pdf")
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        from email.utils import encode_rfc2231
        encoded_name = encode_rfc2231(attachment_filename, charset="utf-8")
        part.add_header("Content-Disposition", "attachment", filename=("utf-8", "", attachment_filename))
        msg.attach(part)

    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, [to], msg.as_string())
    else:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, [to], msg.as_string())


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/send-email", methods=["POST"])
def handle_send_email():
    data = request.json
    if not data:
        return jsonify({"error": "No JSON body"}), 400

    to = data.get("to")
    subject = data.get("subject")
    html = data.get("html")

    if not to or not subject or not html:
        return jsonify({"error": "Missing required fields: to, subject, html"}), 400

    attachment_b64 = data.get("attachment_b64")
    attachment_filename = data.get("attachment_filename")

    try:
        send_email(to, subject, html, attachment_b64, attachment_filename)
        print(f"Email sent to {to}, subject: {subject}")
        return jsonify({"success": True})
    except Exception as e:
        print(f"Email FAILED to {to}: {e}")
        return jsonify({"error": str(e)}), 500


# ─── IMAP settings (for reading emails) ───
IMAP_SERVER = os.environ.get("IMAP_SERVER", "imap.yandex.ru")
IMAP_PORT = int(os.environ.get("IMAP_PORT", 993))
IMAP_USER = os.environ.get("IMAP_USER", SENDER_EMAIL)
IMAP_PASS = os.environ.get("IMAP_PASS", APP_PASSWORD)


def decode_header_value(value):
    """Decode MIME-encoded header into a plain string."""
    if not value:
        return ""
    parts = decode_header(value)
    result = []
    for data, charset in parts:
        if isinstance(data, bytes):
            result.append(data.decode(charset or "utf-8", errors="replace"))
        else:
            result.append(data)
    return "".join(result)


def is_1c_bank_file(filename, content_bytes):
    """Check if attachment looks like a 1CClientBankExchange file."""
    if filename:
        lower = filename.lower()
        if lower.endswith(".txt") or lower.endswith(".1cbe") or "1c" in lower or "выписка" in lower:
            pass  # likely candidate
        elif not lower.endswith(".txt"):
            return False
    # Check content for 1C header signature
    try:
        text = content_bytes.decode("windows-1251", errors="replace")
    except Exception:
        try:
            text = content_bytes.decode("utf-8", errors="replace")
        except Exception:
            return False
    return "1CClientBankExchange" in text[:500]


def decode_1c_content(content_bytes):
    """Decode 1C file bytes to string, trying windows-1251 first."""
    for enc in ["windows-1251", "cp866", "utf-8"]:
        try:
            text = content_bytes.decode(enc)
            if "1CClientBankExchange" in text[:500]:
                return text
        except Exception:
            continue
    return content_bytes.decode("windows-1251", errors="replace")


def fetch_bank_statements(days_back=3, mark_read=False):
    """
    Connect via IMAP, search for Tinkoff bank statement emails,
    extract 1CClientBankExchange attachments.
    Returns list of {filename, content, subject, date}.
    """
    results = []

    mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
    mail.login(IMAP_USER, IMAP_PASS)
    mail.select("INBOX")

    # Search for recent emails from Tinkoff
    since_date = (datetime.now() - timedelta(days=days_back)).strftime("%d-%b-%Y")
    # Search from Tinkoff or with bank statement subjects
    status, msg_ids = mail.search(None, f'(SINCE "{since_date}")')

    if status != "OK" or not msg_ids[0]:
        mail.logout()
        return results

    for msg_id in msg_ids[0].split():
        status, msg_data = mail.fetch(msg_id, "(RFC822)")
        if status != "OK":
            continue

        msg = email_lib.message_from_bytes(msg_data[0][1])
        subject = decode_header_value(msg.get("Subject", ""))
        from_addr = decode_header_value(msg.get("From", "")).lower()
        msg_date = msg.get("Date", "")

        # Filter: only Tinkoff emails with statements
        is_tinkoff = ("tinkoff" in from_addr or "тинькофф" in subject.lower()
                      or "t-bank" in from_addr or "выписка" in subject.lower())
        if not is_tinkoff:
            continue

        # Walk through attachments
        for part in msg.walk():
            if part.get_content_maintype() == "multipart":
                continue
            filename = part.get_filename()
            if filename:
                filename = decode_header_value(filename)

            payload = part.get_payload(decode=True)
            if not payload:
                continue

            if is_1c_bank_file(filename, payload):
                content = decode_1c_content(payload)
                results.append({
                    "filename": filename or "statement.txt",
                    "content": content,
                    "subject": subject,
                    "date": msg_date,
                })

                if mark_read:
                    mail.store(msg_id, "+FLAGS", "\\Seen")

    mail.logout()
    return results


@app.route("/fetch-bank-statements", methods=["POST"])
def handle_fetch_bank_statements():
    data = request.json or {}
    days_back = data.get("days_back", 3)
    mark_read = data.get("mark_read", False)

    try:
        statements = fetch_bank_statements(days_back=days_back, mark_read=mark_read)
        print(f"Fetched {len(statements)} bank statement(s) from email")
        return jsonify({"statements": statements, "count": len(statements)})
    except Exception as e:
        print(f"IMAP fetch FAILED: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Email service starting on port {port}")
    print(f"SMTP: {SMTP_SERVER}:{SMTP_PORT} as {SENDER_EMAIL}")
    print(f"IMAP: {IMAP_SERVER}:{IMAP_PORT} as {IMAP_USER}")
    app.run(host="0.0.0.0", port=port)
