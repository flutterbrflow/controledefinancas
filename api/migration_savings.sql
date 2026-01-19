-- Migration: Add is_savings column to transactions table
ALTER TABLE transactions ADD COLUMN is_savings TINYINT(1) DEFAULT 0;
