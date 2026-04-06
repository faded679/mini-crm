-- Add 'sent' value to InvoiceStatus enum
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'sent' AFTER 'new';
