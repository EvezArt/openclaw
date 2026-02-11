#!/usr/bin/env python3
"""
analyze_spending.py - Read-only transaction analysis script

Analyzes spending patterns from CSV exports of bank/credit card transactions.
This script is STRICTLY READ-ONLY and never modifies accounts or executes transactions.
"""

import argparse
import csv
import sys
from datetime import datetime
from collections import defaultdict
from pathlib import Path


def parse_date(date_str):
    """Parse date from various common formats."""
    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%d/%m/%Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    raise ValueError(f"Unable to parse date: {date_str}")


def parse_amount(amount_str):
    """Parse amount from string, handling various formats."""
    amount_str = amount_str.strip()
    # Remove currency symbols and commas
    amount_str = amount_str.replace("$", "").replace("€", "").replace("£", "")
    amount_str = amount_str.replace(",", "")
    
    # Handle parentheses notation for negative numbers
    if amount_str.startswith("(") and amount_str.endswith(")"):
        amount_str = "-" + amount_str[1:-1]
    
    return float(amount_str)


def analyze_transactions(file_path, period="monthly"):
    """Analyze transactions and return summary statistics."""
    if not Path(file_path).exists():
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)
    
    transactions = []
    
    with open(file_path, "r", encoding="utf-8") as f:
        # Try to detect CSV format
        sample = f.read(1024)
        f.seek(0)
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample)
        
        reader = csv.DictReader(f, dialect=dialect)
        
        # Normalize column names
        fieldnames = [field.strip().lower() for field in reader.fieldnames]
        
        for row in reader:
            # Create normalized row dict
            norm_row = {k.strip().lower(): v for k, v in row.items()}
            
            # Try to extract date, description, and amount
            date_col = next((col for col in fieldnames if "date" in col), None)
            desc_col = next((col for col in fieldnames if "desc" in col or "merchant" in col), None)
            amount_col = next((col for col in fieldnames if "amount" in col or "debit" in col), None)
            category_col = next((col for col in fieldnames if "category" in col or "type" in col), None)
            
            if not all([date_col, desc_col, amount_col]):
                print("Warning: Unable to detect required columns (date, description, amount)", file=sys.stderr)
                continue
            
            try:
                transaction = {
                    "date": parse_date(norm_row[date_col]),
                    "description": norm_row[desc_col],
                    "amount": parse_amount(norm_row[amount_col]),
                    "category": norm_row.get(category_col, "Uncategorized"),
                }
                transactions.append(transaction)
            except (ValueError, KeyError) as e:
                print(f"Warning: Skipping invalid row: {e}", file=sys.stderr)
                continue
    
    if not transactions:
        print("No valid transactions found", file=sys.stderr)
        sys.exit(1)
    
    # Analyze by category
    category_totals = defaultdict(float)
    for t in transactions:
        if t["amount"] > 0:  # Only count expenses
            category_totals[t["category"]] += t["amount"]
    
    # Summary statistics
    total_expenses = sum(t["amount"] for t in transactions if t["amount"] > 0)
    total_income = abs(sum(t["amount"] for t in transactions if t["amount"] < 0))
    avg_transaction = total_expenses / len([t for t in transactions if t["amount"] > 0]) if transactions else 0
    
    # Print report
    print(f"\n{'='*60}")
    print(f"SPENDING ANALYSIS - {period.upper()}")
    print(f"{'='*60}\n")
    
    print(f"Total Transactions: {len(transactions)}")
    print(f"Total Expenses:     ${total_expenses:,.2f}")
    print(f"Total Income:       ${total_income:,.2f}")
    print(f"Net:                ${total_income - total_expenses:,.2f}")
    print(f"Average Transaction: ${avg_transaction:.2f}")
    
    print(f"\n{'='*60}")
    print("SPENDING BY CATEGORY")
    print(f"{'='*60}\n")
    
    for category, total in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        percentage = (total / total_expenses * 100) if total_expenses > 0 else 0
        print(f"{category:30s} ${total:10,.2f} ({percentage:5.1f}%)")
    
    print(f"\n{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Analyze spending from CSV transaction exports (READ-ONLY)"
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to CSV file containing transactions",
    )
    parser.add_argument(
        "--period",
        default="monthly",
        choices=["daily", "weekly", "monthly", "yearly"],
        help="Analysis period (default: monthly)",
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Finance Tracker - Spending Analysis (READ-ONLY)")
    print("This script only reads and analyzes local files.")
    print("No transactions will be executed or accounts modified.")
    print("=" * 60)
    
    analyze_transactions(args.input, args.period)


if __name__ == "__main__":
    main()
