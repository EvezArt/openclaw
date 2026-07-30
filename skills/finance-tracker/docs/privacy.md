# Privacy & Security Best Practices

This document outlines privacy and security practices when using the finance-tracker skill.

## Core Principles

1. **Local Processing Only**: All analysis happens on your local machine. No data is transmitted to external services unless you explicitly configure an export destination.

2. **Read-Only Operations**: This skill never modifies financial accounts, executes transactions, or accesses live banking systems.

3. **No Credential Storage**: Never store passwords, API keys, or authentication tokens. Always use manual exports from your bank's official website or app.

## Data Handling

### Safe Practices ✅

- **Export from official sources**: Download CSVs directly from your bank or financial institution
- **Use temporary directories**: Process files in `{baseDir}/tmp/` and delete after analysis
- **Encrypt at rest**: Keep financial files in encrypted folders (FileVault, BitLocker, LUKS)
- **Limit file permissions**: `chmod 600 sensitive-data.csv` to restrict access
- **Regular cleanup**: Delete exports after analysis is complete
- **Sanitize before sharing**: Remove account numbers and personal details from sample files

### Risky Practices 🚫

- **Never store credentials**: Don't save passwords or API keys in scripts or config files
- **Don't use web scraping**: Automated browser sessions to access accounts are insecure
- **Avoid cloud sync**: Don't sync unencrypted financial files to cloud storage
- **No shared access**: Don't share financial data files with other users on the system
- **Don't automate logins**: Manual exports are safer than automated fetching

## File Security

### Before Analysis

1. Download CSV/PDF exports to a secure location
2. Verify file integrity (check file size and sample contents)
3. Keep original exports in encrypted storage
4. Use copies for analysis (preserve originals unchanged)

### During Analysis

1. Process in a temporary directory: `{baseDir}/tmp/`
2. Limit script execution to read-only operations
3. Monitor script output for unexpected behavior
4. Avoid printing sensitive data to terminal/logs

### After Analysis

1. Move results to secure storage (if keeping)
2. Delete temporary files: `rm -rf {baseDir}/tmp/*`
3. Clear shell history if it contains sensitive filenames
4. Securely delete exports: `shred -u sensitive-file.csv` (Linux) or `rm -P` (macOS)

## Sandboxing (Advanced)

For additional security, run analysis scripts in a sandboxed environment:

### Docker Container

```bash
docker run --rm -v ~/finance:/data:ro -w /app python:3.11-slim \
  python3 analyze_spending.py --input /data/transactions.csv
```

The `:ro` flag ensures read-only access to your data directory.

### Firejail (Linux)

```bash
firejail --private --net=none python3 analyze_spending.py --input transactions.csv
```

This creates an isolated environment with no network access.

### macOS Sandbox

```bash
sandbox-exec -f /tmp/readonly.sb python3 analyze_spending.py --input transactions.csv
```

Create a sandbox profile that restricts file system access.

## Threat Model

### What this skill protects against:
- Accidental credential exposure (refuses to request/store them)
- Transaction execution bugs (read-only by design)
- Network-based attacks (all processing is local)
- Unintended data sharing (no external API calls)

### What this skill does NOT protect against:
- Malware on your system (assume clean environment)
- Physical access to your device (use disk encryption)
- Social engineering (verify you're using the correct scripts)
- OS-level vulnerabilities (keep your system updated)

## Compliance Notes

- **PCI DSS**: This skill does not handle credit card processing or storage
- **GDPR/Privacy**: All data remains on your device; you are the data controller
- **Financial Regulations**: This is an analysis tool, not financial advice or service
- **Tax Compliance**: Verify all reports against official statements; this tool is for convenience, not authoritative records

## Emergency Procedures

If you suspect a security issue:

1. **Stop processing immediately**: Kill any running scripts
2. **Change credentials**: Update passwords for any exposed accounts (though this skill should never handle them)
3. **Review logs**: Check system logs for unexpected access
4. **Delete sensitive files**: Securely wipe any financial exports
5. **Report issues**: File a security report with the OpenClaw project

## Questions?

For security concerns specific to OpenClaw, refer to the main security documentation or file an issue with the maintainers.

---

**Remember**: The best security practice is to minimize data exposure. Only export what you need, analyze it promptly, and delete files when done.
