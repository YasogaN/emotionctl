#!/usr/bin/env node

import { program } from 'commander';
import { JournalManager } from './services/JournalManager';
import { AuthManager } from './services/AuthManager';
import { CLIInterface } from './services/CLIInterface';
import chalk from 'chalk';

async function main() {
  const authManager = new AuthManager();
  const journalManager = new JournalManager();
  const cli = new CLIInterface(authManager, journalManager);

  program
    .name('emotionctl')
    .description('A secure safe space for developers processing heartbreak, breakups, and betrayal')
    .version('1.0.0');

  program
    .command('init')
    .description('Create your secure safe space for emotional healing')
    .action(async () => {
      try {
        await cli.initializeJournal();
      } catch (error) {
        console.error(chalk.red('Error initializing journal:'), error);
        process.exit(1);
      }
    });

  program
    .command('write')
    .description('Process and express your emotions safely')
    .option('-t, --title <title>', 'Entry title')
    .action(async (options) => {
      try {
        await cli.writeEntry(options.title);
      } catch (error) {
        console.error(chalk.red('Error writing entry:'), error);
        process.exit(1);
      }
    });

  program
    .command('read')
    .description('Reflect on your healing journey and emotional growth')
    .option('-d, --date <date>', 'Read entries from specific date (YYYY-MM-DD)')
    .option('-l, --list', 'List all entries')
    .option('-s, --search <term>', 'Search entries by term')
    .action(async (options) => {
      try {
        await cli.readEntries(options);
      } catch (error) {
        console.error(chalk.red('Error reading entries:'), error);
        process.exit(1);
      }
    });

  program
    .command('edit')
    .description('Edit an existing journal entry')
    .option('-i, --id <id>', 'Entry ID to edit')
    .action(async (options) => {
      try {
        await cli.editEntry(options.id);
      } catch (error) {
        console.error(chalk.red('Error editing entry:'), error);
        process.exit(1);
      }
    });

  program
    .command('delete')
    .description('Delete a journal entry')
    .option('-i, --id <id>', 'Entry ID to delete')
    .action(async (options) => {
      try {
        await cli.deleteEntry(options.id);
      } catch (error) {
        console.error(chalk.red('Error deleting entry:'), error);
        process.exit(1);
      }
    });

  program
    .command('backup')
    .description('Create an encrypted backup of your journal')
    .option('-o, --output <path>', 'Output path for backup file')
    .action(async (options) => {
      try {
        await cli.createBackup(options.output);
      } catch (error) {
        console.error(chalk.red('Error creating backup:'), error);
        process.exit(1);
      }
    });

  program
    .command('restore')
    .description('Restore journal from encrypted backup')
    .option('-i, --input <path>', 'Input path for backup file')
    .action(async (options) => {
      try {
        await cli.restoreBackup(options.input);
      } catch (error) {
        console.error(chalk.red('Error restoring backup:'), error);
        process.exit(1);
      }
    });

  program
    .command('change-password')
    .description('Change the journal password')
    .action(async () => {
      try {
        await cli.changePassword();
      } catch (error) {
        console.error(chalk.red('Error changing password:'), error);
        process.exit(1);
      }
    });

  program
    .command('reset')
    .description('Reset the journal (WARNING: Deletes all data)')
    .action(async () => {
      try {
        await cli.resetJournal();
      } catch (error) {
        console.error(chalk.red('Error resetting journal:'), error);
        process.exit(1);
      }
    });

  // Interactive mode when no command is provided
  if (process.argv.length === 2) {
    try {
      await cli.interactiveMode();
    } catch (error) {
      console.error(chalk.red('Error in interactive mode:'), error);
      process.exit(1);
    }
  } else {
    program.parse();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Unexpected error:'), error);
    process.exit(1);
  });
}

export { main };
