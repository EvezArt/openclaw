# Finance Tracker Skill

A read-only financial analysis skill for OpenClaw with strict security guardrails.

## Overview

This skill enables safe, local analysis of financial data from CSV exports, statements, and budget files. It is **strictly read-only** and will refuse any attempts to execute transactions, access live banking systems, or harvest credentials.

## Structure

```
finance-tracker/
├── SKILL.md                    # Main skill definition with guardrails
├── README.md                   # This file
├── scripts/                    # Helper scripts (all read-only)
│   ├── analyze_spending.py     # Spending analysis and reporting
│   └── categorize.py          # Automatic transaction categorization
├── examples/                   # Example files and templates
│   ├── budget-template.json    # Sample budget structure
│   └── csv-formats.md         # Supported CSV formats documentation
├── docs/                       # Additional documentation
│   └── privacy.md             # Security and privacy best practices
└── tmp/                        # Temporary processing directory (gitignored)
```

## Features

### ✅ Allowed Operations

- **File Analysis**: Parse CSV/JSON/PDF exports from financial institutions
- **Categorization**: Automatically categorize transactions
- **Reporting**: Generate spending summaries and budget comparisons
- **Forecasting**: Predict future spending based on historical patterns
- **Anomaly Detection**: Identify unusual transactions

### 🚫 Strictly Disallowed

- Transaction execution (transfers, trades, payments)
- Credential harvesting (passwords, MFA codes, API keys)
- Live account access (no banking API connections)
- Any write operations to financial accounts

## Usage

### Quick Start

1. Export transactions from your bank as CSV
2. Run analysis:
   ```bash
   python3 scripts/analyze_spending.py --input transactions.csv --period monthly
   ```
3. Categorize transactions:
   ```bash
   python3 scripts/categorize.py --input transactions.csv --output categorized.json
   ```

### Integration with OpenClaw

The skill is automatically loaded by OpenClaw from the `skills/` directory. The agent will:
- Understand financial analysis capabilities
- Follow strict guardrails for safety
- Refuse disallowed operations with helpful alternatives

## Security

All scripts operate in **read-only mode**:
- No network connections to banking systems
- No credential storage or transmission
- Local processing only
- Temporary files in `tmp/` (auto-cleaned)

See `docs/privacy.md` for detailed security practices.

## Dependencies

**Required:**
- Python 3.x

**Optional (for enhanced features):**
```bash
pip3 install pandas numpy matplotlib tabulate
```

## Examples

### Example 1: Monthly Spending Report

```bash
python3 scripts/analyze_spending.py \
  --input ~/Downloads/january-transactions.csv \
  --period monthly
```

Output:
```
============================================================
SPENDING ANALYSIS - MONTHLY
============================================================

Total Transactions: 142
Total Expenses:     $3,456.78
Total Income:       $5,000.00
Net:                $1,543.22
Average Transaction: $24.34

============================================================
SPENDING BY CATEGORY
============================================================

Groceries                      $   621.45 ( 18.0%)
Dining Out                     $   487.23 ( 14.1%)
Transportation                 $   356.12 ( 10.3%)
...
```

### Example 2: Auto-Categorization

```bash
python3 scripts/categorize.py \
  --input transactions.csv \
  --output categorized.json
```

Creates a JSON file with categorized transactions for further analysis.

## Guardrails in Action

When users request disallowed operations, the agent will:

**Request**: "Transfer $500 to savings"  
**Response**: "I cannot execute transfers. This skill only analyzes financial data from local files. To move money, please use your bank's official app or website. Would you like me to analyze your recent transfer patterns instead?"

**Request**: "What's my bank password?"  
**Response**: "I cannot and will not request or display passwords. This skill operates only on data you explicitly provide (like CSV exports). Please keep all credentials private and never share them with automated tools."

## Testing

To verify the skill is working:

1. Create a sample CSV:
   ```csv
   Date,Description,Amount,Category
   2024-01-15,Coffee Shop,4.50,Food
   2024-01-16,Gas Station,45.00,Transportation
   2024-01-17,Grocery Store,123.45,Groceries
   ```

2. Run analysis:
   ```bash
   python3 scripts/analyze_spending.py --input sample.csv
   ```

3. Verify output shows summary statistics and category breakdown

## Contributing

When extending this skill:
- Maintain read-only guarantees
- Never add credential handling
- Document all new capabilities in SKILL.md
- Add tests for new scripts
- Update examples and docs as needed

## License

This skill follows the OpenClaw project license. See the main repository LICENSE file.

## Support

For issues or questions:
- Check `docs/privacy.md` for security concerns
- Review `examples/csv-formats.md` for file format help
- File issues on the main OpenClaw repository
