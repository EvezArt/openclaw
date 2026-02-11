---
name: finance-tracker
description: Read-only financial analysis and reporting from local files (CSV, statements, budgets). Strictly prohibited from executing transactions, trading, or credential harvesting.
metadata: { "openclaw": { "emoji": "💰", "requires": { "bins": ["python3"] } } }
---

# Finance Tracker (Read-Only)

Analyze and report on personal finance data from local files. This skill is **strictly read-only** and implements strong guardrails to prevent any transaction execution or credential exposure.

## Allowed Operations ✅

### File Analysis
- Read and parse CSV exports from banks, credit cards, investment accounts
- Analyze PDF statements (read-only extraction)
- Parse budget files (Excel, CSV, JSON)
- Process transaction logs and categorize spending
- Generate reports and summaries

### Analytics & Insights
- Calculate spending by category, vendor, or time period
- Identify unusual transactions or anomalies
- Track budget adherence and forecast future spending
- Compare spending patterns across periods
- Generate visualizations (charts, graphs) from local data
- Calculate investment returns from historical data
- Aggregate multi-account summaries

### Reporting
- Create spending reports (daily, weekly, monthly, yearly)
- Export analysis results to CSV, JSON, or Markdown
- Generate budget vs. actual comparisons
- Produce tax-ready transaction categorization
- Create custom financial dashboards

## Strictly Disallowed Operations 🚫

### Transaction Execution
- **NEVER** initiate wire transfers, ACH payments, or any money movement
- **NEVER** execute stock/crypto trades or place orders
- **NEVER** modify account balances or perform any write operations to financial accounts
- **NEVER** submit bill payments or schedule transfers
- **NEVER** connect to banking APIs for transaction execution

### Credential & Security
- **NEVER** request, store, or display passwords, PINs, or security answers
- **NEVER** ask for MFA codes, TOTP tokens, or authentication challenges
- **NEVER** harvest API keys, access tokens, or session credentials
- **NEVER** store sensitive data in plain text or insecure locations
- **NEVER** transmit credentials over unencrypted connections

### Account Access
- **NEVER** log into banking websites or financial APIs
- **NEVER** scrape live account data without explicit user-provided exports
- **NEVER** automate browser sessions to access financial accounts
- **NEVER** use stored credentials to fetch live data

## Safety Behavior

When a user requests disallowed operations:

1. **Refuse politely**: "I cannot execute transactions or access live banking systems. This skill is read-only for security."
2. **Explain why**: "Executing financial transactions requires secure authentication and is beyond the scope of automated analysis tools."
3. **Offer alternatives**: 
   - "I can analyze a CSV export of your transactions instead."
   - "Would you like me to prepare a report based on your downloaded statements?"
   - "I can help you categorize expenses from your exported data."

### Example Refusals

**User**: "Transfer $500 to my savings account"
**Response**: "I cannot execute transfers. This skill only analyzes financial data from local files. To move money, please use your bank's official app or website. Would you like me to analyze your recent transfer patterns instead?"

**User**: "Buy 10 shares of AAPL"
**Response**: "I cannot execute trades. For security, this skill is read-only. Please use your brokerage's platform for trading. I can help you analyze your investment history from exported data if you'd like."

**User**: "What's my bank password?"
**Response**: "I cannot and will not request or display passwords. This skill operates only on data you explicitly provide (like CSV exports). Please keep all credentials private and never share them with automated tools."

## Usage Examples

### Analyze spending from CSV export

```bash
python3 {baseDir}/scripts/analyze_spending.py --input ~/Downloads/transactions.csv --period monthly
```

### Categorize transactions

```bash
python3 {baseDir}/scripts/categorize.py --input statement.csv --output categorized.json
```

### Generate budget report

```bash
python3 {baseDir}/scripts/budget_report.py --transactions transactions.csv --budget budget.json
```

### Identify anomalies

```bash
python3 {baseDir}/scripts/anomaly_detector.py --input transactions.csv --threshold 2.5
```

## File Format Support

- **CSV**: Standard bank/credit card exports (date, description, amount, category)
- **JSON**: Custom budget files or API exports
- **PDF**: Statement parsing (read-only, no form filling)
- **Excel/XLSX**: Budget templates and financial plans

## Data Privacy

- All processing happens **locally** on your machine
- No data is transmitted to external services (unless you explicitly configure an export)
- Temporary files are created in `{baseDir}/tmp/` and can be cleared with `rm -rf {baseDir}/tmp/*`
- No credentials or sensitive data are stored by this skill

## Setup

1. Ensure Python 3 is installed: `python3 --version`
2. Install optional dependencies for enhanced features:
   ```bash
   pip3 install pandas numpy matplotlib tabulate
   ```
3. Place financial data exports in a known directory (e.g., `~/Documents/finance/`)
4. Run analysis scripts from `{baseDir}/scripts/`

## Notes

- This skill is designed to complement, not replace, secure financial software
- Always verify reports against official statements
- Keep sensitive financial files encrypted at rest when not in use
- Consider using this skill in a sandboxed environment for added security

## References

- Example budget file format: `{baseDir}/examples/budget-template.json`
- Supported CSV column mappings: `{baseDir}/examples/csv-formats.md`
- Privacy best practices: `{baseDir}/docs/privacy.md`
