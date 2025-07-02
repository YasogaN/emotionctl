# EmotionCtl Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to decrypt entries" Error

**Symptoms:**

- Error message: `Error: Failed to decrypt entries. Please check your password.`
- This happens when trying to read or write entries

**Possible Causes:**

- Incorrect password
- Corrupted journal files
- Incomplete initialization

**Solutions:**

#### Option 1: Verify Password

Make sure you're entering the exact same password you used during initialization. Passwords are case-sensitive.

#### Option 2: Check for Corruption

If you're certain the password is correct, the journal files may be corrupted. Try:

1. **Reset and restore from backup** (if you have one):

   ```bash
   emotionctl reset
   emotionctl init
   emotionctl restore --input path/to/backup.json
   ```

2. **Complete reset** (WARNING: This deletes all data):
   ```bash
   emotionctl reset
   emotionctl init
   ```

### 2. "Journal not initialized" Error

**Symptoms:**

- Error message: `Journal not initialized. Run "emotionctl init" first.`

**Solution:**
Run the initialization command:

```bash
emotionctl init
```

### 3. Permission Denied Errors

**Symptoms:**

- Cannot create or access files in the home directory
- Permission denied when saving entries

**Solutions:**

#### Windows:

- Ensure you have write permissions to your user directory
- Try running as administrator if necessary
- Check if antivirus is blocking file access

#### macOS/Linux:

- Check home directory permissions: `ls -la ~/`
- Fix permissions if needed: `chmod 755 ~/.emotionctl`

### 4. "Cannot find module" Errors

**Symptoms:**

- Import errors when running the application
- Missing dependency errors

**Solution:**
Reinstall dependencies:

```bash
yarn install
yarn build
```

### 5. Editor Not Opening for Entry Writing

**Symptoms:**

- No editor opens when writing entries
- "Editor" option doesn't work in prompts

**Solutions:**

#### Set Default Editor:

**Windows:**

```bash
set EDITOR=notepad
# or
set EDITOR=code
```

**macOS/Linux:**

```bash
export EDITOR=nano
# or
export EDITOR=vim
# or
export EDITOR=code
```

#### Alternative: Use Input Mode

If editor doesn't work, you can modify the CLI to use input mode instead of editor mode.

### 6. Backup/Restore Issues

**Symptoms:**

- Cannot create backups
- Restore fails with decryption errors

**Solutions:**

#### For Backup Issues:

1. Ensure you have write permissions to the output directory
2. Check available disk space
3. Try specifying a different output path:
   ```bash
   emotionctl backup --output ~/Desktop/journal-backup.json
   ```

#### For Restore Issues:

1. Verify the backup file exists and is readable
2. Ensure you're using the correct password (same as when backup was created)
3. Check backup file integrity (should be valid JSON)

### 7. Performance Issues

**Symptoms:**

- Slow startup
- Long delays when reading entries

**Solutions:**

- Large number of entries can slow down operations
- Consider creating periodic backups and starting fresh if you have thousands of entries
- Check available system memory

## Data Recovery

### If You've Lost Your Password

Unfortunately, if you've lost your password, there's no way to recover your encrypted journal entries. This is by design for security. Your options are:

1. **Try to remember variations** of your password
2. **Restore from a backup** if you have one with a known password
3. **Start fresh** with `emotionctl reset` and `emotionctl init`

### If Journal Files Are Corrupted

1. **Check for backups** in the default location:
   - Windows: `%USERPROFILE%\.emotionctl\`
   - macOS/Linux: `~/.emotionctl/`

2. **Look for automatic backups** (if you've created any)

3. **Try manual file recovery** (advanced users only):
   - Navigate to `~/.emotionctl/`
   - Check if `entries.json.bak` or similar backup files exist
   - Try restoring from these files

## Getting Additional Help

### Diagnostic Information

When reporting issues, please include:

1. **Operating System**: Windows/macOS/Linux version
2. **Node.js Version**: Run `node --version`
3. **Yarn Version**: Run `yarn --version`
4. **Error Message**: Full error text
5. **Steps to Reproduce**: What you were doing when the error occurred

### Log Files

You can enable debug logging by setting the environment variable:

**Windows:**

```bash
set DEBUG=emotionctl:*
emotionctl [command]
```

**macOS/Linux:**

```bash
DEBUG=emotionctl:* emotionctl [command]
```

### Safe Mode

If you're having persistent issues, try these steps:

1. **Backup your data** (if accessible):

   ```bash
   emotionctl backup --output ~/emergency-backup.json
   ```

2. **Reset configuration**:

   ```bash
   emotionctl reset
   ```

3. **Reinitialize**:

   ```bash
   emotionctl init
   ```

4. **Restore data** (if you have a backup):
   ```bash
   emotionctl restore --input ~/emergency-backup.json
   ```

## Prevention Tips

1. **Regular Backups**: Create backups regularly

   ```bash
   emotionctl backup --output ~/Backups/journal-$(date +%Y-%m-%d).json
   ```

2. **Password Management**: Use a password manager to store your journal password securely

3. **Multiple Backups**: Keep backups in multiple locations (external drive, cloud storage)

4. **Test Restores**: Occasionally test your backup files to ensure they work

5. **Keep Dependencies Updated**: Regularly update the application
   ```bash
   yarn install
   yarn build
   ```

## Emergency Recovery Script

If you need to quickly recover from a corrupted state:

```bash
# Create emergency backup (if possible)
emotionctl backup --output emergency-backup-$(date +%Y%m%d).json

# Reset everything
emotionctl reset

# Reinitialize
emotionctl init

# Restore from backup (if available)
emotionctl restore --input emergency-backup-YYYYMMDD.json
```

Remember: The encryption is designed to be unbreakable, so always keep your password safe and create regular backups!
