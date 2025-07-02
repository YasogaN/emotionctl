# EmotionCtl - A Safe Space for Developers

A secure, private terminal-based journaling application designed specifically for developers going through heartbreak, breakups, or betrayal. EmotionCtl provides a safe digital sanctuary to process emotions, track healing progress, and maintain mental health during life's most challenging moments.

## Why EmotionCtl?

As developers, we're often so focused on solving technical problems that we neglect our emotional well-being. When relationships end or trust is broken, we need a private space to process these complex feelings without judgment. EmotionCtl combines the security you expect as a developer with the emotional support you need as a human.

## Features

🔐 **Complete Privacy**: Military-grade AES-256-CBC encryption keeps your deepest thoughts secure
💙 **Safe Space**: Judgment-free zone designed for emotional processing and healing
📝 **Expressive Journaling**: Write freely with mood tracking, tags, and rich text support
🔍 **Pattern Recognition**: Search and analyze your emotional journey to understand triggers and growth
💾 **Secure Backups**: Encrypted backups ensure your healing journey is never lost
🎨 **Gentle Interface**: Calming terminal UI that respects your emotional state
📊 **Progress Tracking**: Visualize your healing journey with detailed statistics
🛡️ **Developer-Grade Security**: PBKDF2 password hashing and local-only storage

## Installation

### Prerequisites

- Node.js 16+ and npm/yarn
- Git

### Setup

1. Clone or download this repository
2. Install dependencies:

```bash
yarn install
```

3. Build the project:

```bash
yarn build
```

4. (Optional) Install globally:

```bash
npm install -g .
```

## Usage

### Initialize Your Safe Space

Create your private, encrypted emotional sanctuary:

```bash
emotionctl init
```

This creates a secure space where you can process your feelings without fear of judgment or exposure.

### Process Your Emotions

Express yourself freely in a safe environment:

```bash
emotionctl write
```

Or capture a specific moment:

```bash
emotionctl write --title "The day everything changed"
```

### Reflect on Your Healing Journey

Review your emotional progress:

```bash
emotionctl read
```

Find entries from difficult days:

```bash
emotionctl read --list
```

Look back at a specific moment:

```bash
emotionctl read --date 2025-07-02
```

Search for growth patterns:

```bash
emotionctl read --search "healing"
emotionctl read --search "breakthrough"
emotionctl read --search "stronger"
```

### Managing Entries

Delete an entry:

```bash
emotionctl delete --id <entry-id>
```

### Backup and Restore

Create a backup:

```bash
emotionctl backup --output ~/my-journal-backup.json
```

Restore from backup:

```bash
emotionctl restore --input ~/my-journal-backup.json
```

### Security

Change your password:

```bash
emotionctl change-password
```

### Reset Journal

⚠️ **WARNING**: This permanently deletes all journal data!

```bash
emotionctl reset
```

### Interactive Mode

Run without any commands for interactive mode:

```bash
emotionctl
```

## Development

### Scripts

- `yarn dev` - Run in development mode with ts-node
- `yarn build` - Build the TypeScript project
- `yarn watch` - Build in watch mode
- `yarn test` - Run tests
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier

### Project Structure

```
src/
├── index.ts              # Main entry point and CLI setup
├── types/
│   └── index.ts          # TypeScript type definitions
└── services/
    ├── AuthManager.ts    # Password and authentication management
    ├── CryptoService.ts  # Encryption/decryption utilities
    ├── JournalManager.ts # Journal entry management
    └── CLIInterface.ts   # User interface and interaction
```

## Security Features

### Encryption

- **Algorithm**: AES-256-CBC encryption
- **Key Derivation**: PBKDF2 with SHA-256 (10,000 iterations)
- **Random Elements**: Each encryption uses a unique salt and IV
- **Password Hashing**: Passwords are hashed using PBKDF2 before storage

### Data Storage

- All data is stored locally in `~/.emotionctl/`
- Journal entries are encrypted before being written to disk
- Configuration and authentication data are stored separately
- No data is ever transmitted over the network

### Best Practices

- Use a strong, unique password for your journal
- Regularly create encrypted backups
- Store backups in secure locations
- Never share your journal password

## File Structure

```
~/.emotionctl/
├── auth.json           # Encrypted authentication data
├── config.json         # Journal configuration
└── entries.json        # Encrypted journal entries
```

## Dependencies

### Runtime Dependencies

- **commander**: CLI framework
- **inquirer**: Interactive prompts
- **chalk**: Terminal colors
- **crypto-js**: Encryption library
- **date-fns**: Date manipulation
- **fs-extra**: Enhanced file system operations

### Development Dependencies

- **typescript**: TypeScript compiler
- **ts-node**: TypeScript execution
- **jest**: Testing framework
- **eslint**: Code linting
- **prettier**: Code formatting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

**"Journal not initialized"**

- Run `emotionctl init` to set up your journal

**"Authentication failed"**

- Ensure you're entering the correct password
- If you forgot your password, you'll need to restore from a backup or start fresh

**"Permission denied"**

- Ensure you have write permissions to your home directory
- On some systems, you may need to run with appropriate permissions

### Getting Help

If you encounter issues:

1. Check that all dependencies are installed correctly
2. Ensure Node.js version is 16+
3. Verify file permissions in your home directory
4. Check that no other processes are using the journal files

## Security Considerations

This application is designed for personal use and stores all data locally. While it uses strong encryption, please consider:

- Regular backups are essential
- Store backups securely
- Use a strong, memorable password
- Keep your system secure and updated
- Be aware that this is not audited cryptographic software

For sensitive information, consider using additional security measures like full-disk encryption.
