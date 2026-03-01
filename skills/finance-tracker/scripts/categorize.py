#!/usr/bin/env python3
"""
categorize.py - Automatic transaction categorization (READ-ONLY)

Categorizes transactions based on merchant names and keywords.
Output is a JSON file with categorized transactions.
"""

import argparse
import csv
import json
import sys
from pathlib import Path
from datetime import datetime


# Category mapping rules
CATEGORY_RULES = {
    "Groceries": ["grocery", "supermarket", "whole foods", "trader joe", "safeway", "kroger"],
    "Dining Out": ["restaurant", "cafe", "coffee", "starbucks", "chipotle", "mcdonald"],
    "Transportation": ["gas", "fuel", "uber", "lyft", "transit", "parking", "exxon", "shell"],
    "Housing": ["rent", "mortgage", "property", "utilities", "electric", "water", "gas company"],
    "Healthcare": ["pharmacy", "cvs", "walgreens", "hospital", "clinic", "doctor", "medical"],
    "Entertainment": ["netflix", "spotify", "hulu", "movie", "theater", "concert", "gaming"],
    "Shopping": ["amazon", "walmart", "target", "mall", "retail", "clothing"],
    "Insurance": ["insurance", "geico", "state farm", "allstate"],
    "Income": ["payroll", "direct deposit", "salary", "transfer in", "payment received"],
}


def categorize_transaction(description):
    """Categorize a transaction based on its description."""
    description_lower = description.lower()
    
    for category, keywords in CATEGORY_RULES.items():
        for keyword in keywords:
            if keyword in description_lower:
                return category
    
    return "Uncategorized"


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
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str


def parse_amount(amount_str):
    """Parse amount from string."""
    amount_str = amount_str.strip()
    amount_str = amount_str.replace("$", "").replace("€", "").replace("£", "")
    amount_str = amount_str.replace(",", "")
    
    if amount_str.startswith("(") and amount_str.endswith(")"):
        amount_str = "-" + amount_str[1:-1]
    
    return float(amount_str)


def categorize_transactions(input_file, output_file):
    """Read CSV, categorize transactions, and write JSON output."""
    if not Path(input_file).exists():
        print(f"Error: Input file not found: {input_file}", file=sys.stderr)
        sys.exit(1)
    
    transactions = []
    
    with open(input_file, "r", encoding="utf-8") as f:
        sample = f.read(1024)
        f.seek(0)
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample)
        
        reader = csv.DictReader(f, dialect=dialect)
        fieldnames = [field.strip().lower() for field in reader.fieldnames]
        
        for row in reader:
            norm_row = {k.strip().lower(): v for k, v in row.items()}
            
            # Detect columns
            date_col = next((col for col in fieldnames if "date" in col), None)
            desc_col = next((col for col in fieldnames if "desc" in col or "merchant" in col), None)
            amount_col = next((col for col in fieldnames if "amount" in col or "debit" in col), None)
            
            if not all([date_col, desc_col, amount_col]):
                continue
            
            try:
                description = norm_row[desc_col]
                category = categorize_transaction(description)
                
                transaction = {
                    "date": parse_date(norm_row[date_col]),
                    "description": description,
                    "amount": parse_amount(norm_row[amount_col]),
                    "category": category,
                    "auto_categorized": True,
                }
                transactions.append(transaction)
            except (ValueError, KeyError) as e:
                print(f"Warning: Skipping row: {e}", file=sys.stderr)
                continue
    
    if not transactions:
        print("No transactions to categorize", file=sys.stderr)
        sys.exit(1)
    
    # Write output
    output_data = {
        "metadata": {
            "source_file": str(Path(input_file).name),
            "categorized_at": datetime.now().isoformat(),
            "total_transactions": len(transactions),
        },
        "transactions": transactions,
    }
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)
    
    # Print summary
    category_counts = {}
    for t in transactions:
        cat = t["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    print(f"\n{'='*60}")
    print("CATEGORIZATION COMPLETE")
    print(f"{'='*60}\n")
    print(f"Total transactions: {len(transactions)}")
    print(f"Output written to: {output_file}\n")
    
    print("Breakdown by category:")
    for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(transactions) * 100)
        print(f"  {category:30s} {count:4d} ({percentage:5.1f}%)")
    
    print(f"\n{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Categorize transactions from CSV (READ-ONLY)"
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to input CSV file",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Path to output JSON file",
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Finance Tracker - Transaction Categorization (READ-ONLY)")
    print("This script only reads CSV files and produces JSON output.")
    print("No financial accounts will be modified.")
    print("=" * 60)
    
    categorize_transactions(args.input, args.output)


if __name__ == "__main__":
    main()
