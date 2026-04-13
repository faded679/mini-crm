# -*- coding: utf-8 -*-
import smtplib
import os
import base64
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
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg["To"] = to

    msg.attach(MIMEText(html, "html", "utf-8"))

    if attachment_b64 and attachment_filename:
        pdf_bytes = base64.b64decode(attachment_b64)
        part = MIMEBase("application", "pdf")
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        encoded_name = Header(attachment_filename, "utf-8").encode()
        part.add_header("Content-Disposition", f'attachment; filename="{encoded_name}"')
        msg.attach(part)

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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Email service starting on port {port}")
    print(f"SMTP: {SMTP_SERVER}:{SMTP_PORT} as {SENDER_EMAIL}")
    app.run(host="0.0.0.0", port=port)
