# Supported CSV Formats

This document describes the CSV formats that the finance-tracker skill can parse.

## Standard Transaction Format

The most common format exported by banks and credit cards:

```csv
Date,Description,Amount,Category,Account
2024-01-15,Coffee Shop,4.50,Food & Dining,Checking
2024-01-16,Gas Station,45.00,Transportation,Credit Card
2024-01-16,Grocery Store,123.45,Groceries,Credit Card
2024-01-17,Rent Payment,-2000.00,Housing,Checking
```

### Required Columns
- **Date**: Transaction date (YYYY-MM-DD, MM/DD/YYYY, or DD-MM-YYYY)
- **Description**: Merchant or transaction description
- **Amount**: Transaction amount (positive for expenses, negative for income/refunds)

### Optional Columns
- **Category**: Pre-categorized transaction type
- **Account**: Account name or last 4 digits
- **Notes**: Additional transaction notes
- **ID**: Unique transaction identifier

## Alternative Formats

### Format 1: Bank Export (Debit/Credit columns)

```csv
Date,Description,Debit,Credit,Balance
2024-01-15,Coffee Shop,4.50,,1245.50
2024-01-16,Direct Deposit,,3000.00,4245.50
```

### Format 2: Credit Card Statement

```csv
Transaction Date,Post Date,Description,Category,Type,Amount
01/15/2024,01/16/2024,Amazon.com,Shopping,Sale,45.67
01/15/2024,01/16/2024,Payment - Thank You,Payment/Credit,Payment,-500.00
```

### Format 3: Investment Account

```csv
Date,Type,Security,Shares,Price,Amount,Balance
2024-01-15,Buy,AAPL,10,150.00,1500.00,8500.00
2024-01-20,Dividend,AAPL,0,0,25.50,8525.50
```

## Column Mapping

The analysis scripts will attempt to auto-detect columns but you can specify mappings:

```bash
python3 scripts/analyze_spending.py --input transactions.csv \
  --date-column "Transaction Date" \
  --description-column "Description" \
  --amount-column "Amount"
```

## Data Cleaning

Scripts will automatically:
- Parse dates in various formats
- Remove currency symbols ($, €, £, etc.)
- Handle negative numbers in various formats (-100, (100), 100-)
- Trim whitespace from descriptions
- Skip header rows and empty lines

## Privacy Note

Always sanitize exported files before sharing:
- Remove account numbers
- Replace merchant names with categories if needed
- Mask any personal identifiers
