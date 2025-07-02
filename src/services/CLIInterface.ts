import chalk from 'chalk';
import { format } from 'date-fns';
import { AuthManager } from './AuthManager';
import { JournalManager } from './JournalManager';
import { Editor } from './Editor';
import { ReadOptions, MoodType } from '../types';

export class CLIInterface {
  private authManager: AuthManager;
  private journalManager: JournalManager;
  private currentPassword: string = '';
  private inquirer: any = null;

  constructor(authManager: AuthManager, journalManager: JournalManager) {
    this.authManager = authManager;
    this.journalManager = journalManager;
  }

  /**
   * Dynamically imports inquirer
   */
  private async getInquirer(): Promise<any> {
    if (!this.inquirer) {
      const inquirer = await import('inquirer');
      this.inquirer = inquirer.default || inquirer;
    }
    return this.inquirer;
  }

  /**
   * Displays the welcome banner
   */
  private displayBanner(): void {
    console.clear();
    console.log(chalk.cyan('╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║          EmotionCtl Journal          ║'));
    console.log(chalk.cyan('║      Your Safe Space for Healing     ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝'));
    console.log();
  }

  /**
   * Prompts for password with confirmation
   */
  private async promptPassword(confirm: boolean = false): Promise<string> {
    const inquirer = await this.getInquirer();
    const questions = [
      {
        type: 'password',
        name: 'password',
        message: 'Enter your journal password:',
        mask: '*'
      }
    ];

    if (confirm) {
      questions.push({
        type: 'password',
        name: 'confirmPassword',
        message: 'Confirm your password:',
        mask: '*'
      });
    }

    const answers = await inquirer.prompt(questions);

    if (confirm && answers.password !== answers.confirmPassword) {
      console.log(chalk.red('Passwords do not match. Please try again.'));
      return this.promptPassword(confirm);
    }

    return answers.password;
  }

  /**
   * Authenticates the user
   */
  private async authenticate(): Promise<boolean> {
    if (this.currentPassword) {
      return true;
    }

    const password = await this.promptPassword();
    const isAuthenticated = await this.authManager.authenticate(password);

    if (isAuthenticated) {
      this.currentPassword = password;
      await this.journalManager.load(password);
      return true;
    } else {
      console.log(chalk.red('Invalid password. Please try again.'));
      return false;
    }
  }

  /**
   * Initializes a new journal
   */
  async initializeJournal(): Promise<void> {
    this.displayBanner();

    if (await this.authManager.isInitialized()) {
      console.log(chalk.yellow('Journal is already initialized.'));
      return;
    }

    console.log(chalk.green('Welcome! Let\'s create your safe space for emotional healing.'));
    console.log(chalk.gray('Your thoughts and feelings will be encrypted and stored securely on your device.'));
    console.log(chalk.gray('This is your judgment-free zone for processing difficult emotions.'));
    console.log();

    const password = await this.promptPassword(true); try {
      await this.authManager.initialize(password);
      await this.journalManager.initialize(password);

      console.log(chalk.green('✓ Your safe space is ready!'));
      console.log(chalk.gray('You can now start processing your emotions with: emotionctl write'));
      console.log(chalk.gray('Remember: Healing isn\'t linear, and every feeling is valid. 💙'));
    } catch (error) {
      console.error(chalk.red('Failed to initialize journal:'), error);
    }
  }

  /**
   * Writes a new journal entry
   */
  async writeEntry(title?: string): Promise<void> {
    if (!await this.authManager.isInitialized()) {
      console.log(chalk.red('Safe space not set up yet. Run "emotionctl init" to create your secure sanctuary.'));
      return;
    }

    if (!await this.authenticate()) {
      return;
    }

    const questions: any[] = [];

    if (!title) {
      questions.push({
        type: 'input',
        name: 'title',
        message: 'What would you like to call this entry?',
        validate: (input: string) => input.trim().length > 0 || 'Your entry needs a title'
      });
    }

    questions.push(
      {
        type: 'list',
        name: 'mood',
        message: 'How are you feeling right now?',
        choices: [
          { name: `${MoodType.SAD} Sad - it's okay to feel this way`, value: MoodType.SAD },
          { name: `${MoodType.ANGRY} Angry - your feelings are valid`, value: MoodType.ANGRY },
          { name: `${MoodType.ANXIOUS} Anxious - you're not alone in this`, value: MoodType.ANXIOUS },
          { name: `${MoodType.NEUTRAL} Neutral - processing emotions`, value: MoodType.NEUTRAL },
          { name: `${MoodType.CALM} Calm - finding peace`, value: MoodType.CALM },
          { name: `${MoodType.GRATEFUL} Grateful - recognizing growth`, value: MoodType.GRATEFUL },
          { name: `${MoodType.HAPPY} Happy - celebrating progress`, value: MoodType.HAPPY },
          { name: `${MoodType.EXCITED} Excited - looking forward`, value: MoodType.EXCITED },
          { name: 'Skip for now', value: undefined }
        ]
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags to help you reflect later (e.g., "healing", "breakthrough", "setback"):',
        filter: (input: string) => input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      }
    );

    const inquirer = await this.getInquirer();
    const answers = await inquirer.prompt(questions);

    // Open editor for content
    let content: string;
    try {
      console.log();
      console.log(chalk.blue('Express yourself freely - your thoughts are safe here.'));
      content = await this.openEditor();

      if (!content.trim()) {
        console.log(chalk.yellow('Entry cancelled - no content provided.'));
        return;
      }
    } catch (error) {
      console.error(chalk.red('Failed to open editor:'), error);
      console.log(chalk.yellow('Falling back to simple text input...'));

      const inquirer = await this.getInquirer();
      const fallbackAnswer = await inquirer.prompt([{
        type: 'input',
        name: 'content',
        message: 'Write your entry here:',
        validate: (input: string) => input.trim().length > 0 || 'It\'s okay to share what you\'re feeling'
      }]);

      content = fallbackAnswer.content;
    }

    try {
      const entry = await this.journalManager.addEntry(
        title || answers.title,
        content,
        this.currentPassword,
        answers.mood,
        answers.tags
      );

      console.log(chalk.green('✓ Your thoughts have been safely stored'));
      console.log(chalk.gray(`Entry ID: ${entry.id}`));
      console.log(chalk.blue('Remember: Every step in processing your emotions is progress. 💙'));
    } catch (error) {
      console.error(chalk.red('Failed to save entry:'), error);
    }
  }

  /**
   * Edits an existing journal entry
   */
  async editEntry(id?: string): Promise<void> {
    if (!await this.authManager.isInitialized()) {
      console.log(chalk.red('Journal not initialized. Run "emotionctl init" first.'));
      return;
    }

    if (!await this.authenticate()) {
      return;
    }

    try {
      let entryId = id;

      if (!entryId) {
        const entries = this.journalManager.getEntries();
        if (entries.length === 0) {
          console.log(chalk.yellow('No entries to edit.'));
          return;
        }

        const choices = entries.map(entry => ({
          name: `${format(entry.date, 'PPP')} - ${entry.title}`,
          value: entry.id
        }));

        const inquirer = await this.getInquirer();
        const { selectedId } = await inquirer.prompt({
          type: 'list',
          name: 'selectedId',
          message: 'Select entry to edit:',
          choices
        });

        entryId = selectedId;
      }

      const entry = this.journalManager.getEntryById(entryId!);
      if (!entry) {
        console.log(chalk.red('Entry not found.'));
        return;
      }

      console.log(chalk.blue(`Editing entry: ${entry.title}`));
      console.log(chalk.gray(`Created: ${format(entry.date, 'PPP')}`));
      console.log();

      const inquirer = await this.getInquirer();
      const { action } = await inquirer.prompt({
        type: 'list',
        name: 'action',
        message: 'What would you like to edit?',
        choices: [
          { name: 'Edit content (opens editor)', value: 'content' },
          { name: 'Edit title', value: 'title' },
          { name: 'Edit mood', value: 'mood' },
          { name: 'Edit tags', value: 'tags' },
          { name: 'Cancel', value: 'cancel' }
        ]
      });

      if (action === 'cancel') {
        console.log(chalk.yellow('Edit cancelled.'));
        return;
      }

      const updates: any = {};

      switch (action) {
        case 'content':
          try {
            console.log();
            console.log(chalk.blue('Opening editor with current content...'));
            const newContent = await this.openEditor(entry.content);

            if (newContent.trim() === entry.content.trim()) {
              console.log(chalk.yellow('No changes made to content.'));
              return;
            }

            updates.content = newContent;
          } catch (error) {
            console.error(chalk.red('Failed to open editor:'), error);
            return;
          }
          break;

        case 'title':
          const inquirer1 = await this.getInquirer();
          const { newTitle } = await inquirer1.prompt({
            type: 'input',
            name: 'newTitle',
            message: 'Enter new title:',
            default: entry.title,
            validate: (input: string) => input.trim().length > 0 || 'Title cannot be empty'
          });
          updates.title = newTitle;
          break;

        case 'mood':
          const inquirer2 = await this.getInquirer();
          const { newMood } = await inquirer2.prompt({
            type: 'list',
            name: 'newMood',
            message: 'Select new mood:',
            default: entry.mood,
            choices: [
              { name: `${MoodType.SAD} Sad`, value: MoodType.SAD },
              { name: `${MoodType.ANGRY} Angry`, value: MoodType.ANGRY },
              { name: `${MoodType.ANXIOUS} Anxious`, value: MoodType.ANXIOUS },
              { name: `${MoodType.NEUTRAL} Neutral`, value: MoodType.NEUTRAL },
              { name: `${MoodType.CALM} Calm`, value: MoodType.CALM },
              { name: `${MoodType.GRATEFUL} Grateful`, value: MoodType.GRATEFUL },
              { name: `${MoodType.HAPPY} Happy`, value: MoodType.HAPPY },
              { name: `${MoodType.EXCITED} Excited`, value: MoodType.EXCITED },
              { name: 'Clear mood', value: undefined }
            ]
          });
          updates.mood = newMood;
          break;

        case 'tags':
          const inquirer3 = await this.getInquirer();
          const { newTags } = await inquirer3.prompt({
            type: 'input',
            name: 'newTags',
            message: 'Enter tags (comma separated):',
            default: entry.tags?.join(', ') || '',
            filter: (input: string) => input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          });
          updates.tags = newTags;
          break;
      }

      const success = await this.journalManager.updateEntry(entryId!, updates, this.currentPassword);

      if (success) {
        console.log(chalk.green('✓ Entry updated successfully'));
        console.log(chalk.blue('Your healing journey continues. 💙'));
      } else {
        console.log(chalk.red('Failed to update entry.'));
      }

    } catch (error) {
      console.error(chalk.red('Failed to edit entry:'), error);
    }
  }

  /**
   * Reads journal entries
   */
  async readEntries(options: ReadOptions): Promise<void> {
    if (!await this.authManager.isInitialized()) {
      console.log(chalk.red('Journal not initialized. Run "emotionctl init" first.'));
      return;
    }

    if (!await this.authenticate()) {
      return;
    }

    try {
      let entries;

      if (options.date) {
        entries = this.journalManager.getEntriesByDate(options.date);
        console.log(chalk.blue(`Entries for ${options.date}:`));
      } else if (options.search) {
        entries = this.journalManager.searchEntries(options.search);
        console.log(chalk.blue(`Search results for "${options.search}":`));
      } else if (options.list) {
        entries = this.journalManager.getEntries();
        console.log(chalk.blue('All entries:'));
      } else {
        // Show recent entries (last 5)
        entries = this.journalManager.getEntries().slice(0, 5);
        console.log(chalk.blue('Recent entries:'));
      }

      if (entries.length === 0) {
        console.log(chalk.yellow('No entries found.'));
        return;
      }

      entries.forEach((entry, index) => {
        console.log(chalk.cyan(`\n─── Entry ${index + 1} ───`));
        console.log(chalk.bold(`Title: ${entry.title}`));
        console.log(chalk.gray(`Date: ${format(entry.date, 'PPP p')}`));
        console.log(chalk.gray(`ID: ${entry.id}`));

        if (entry.mood) {
          console.log(chalk.gray(`Mood: ${entry.mood}`));
        }

        if (entry.tags && entry.tags.length > 0) {
          console.log(chalk.gray(`Tags: ${entry.tags.join(', ')}`));
        }

        console.log(`\n${entry.content}\n`);
      });

    } catch (error) {
      console.error(chalk.red('Failed to read entries:'), error);
    }
  }

  /**
   * Deletes a journal entry
   */
  async deleteEntry(id?: string): Promise<void> {
    if (!await this.authManager.isInitialized()) {
      console.log(chalk.red('Journal not initialized. Run "emotionctl init" first.'));
      return;
    }

    if (!await this.authenticate()) {
      return;
    }

    try {
      if (!id) {
        const entries = this.journalManager.getEntries();
        if (entries.length === 0) {
          console.log(chalk.yellow('No entries to delete.'));
          return;
        }

        const choices = entries.map(entry => ({
          name: `${format(entry.date, 'PPP')} - ${entry.title}`,
          value: entry.id
        }));

        const inquirer = await this.getInquirer();
        const { selectedId } = await inquirer.prompt({
          type: 'list',
          name: 'selectedId',
          message: 'Select entry to delete:',
          choices
        });

        id = selectedId;
      }

      const entry = this.journalManager.getEntryById(id!);
      if (!entry) {
        console.log(chalk.red('Entry not found.'));
        return;
      }

      console.log(chalk.yellow(`\nEntry to delete:`));
      console.log(chalk.bold(`Title: ${entry.title}`));
      console.log(chalk.gray(`Date: ${format(entry.date, 'PPP p')}`));
      console.log(`Content preview: ${entry.content.substring(0, 100)}...`);

      const inquirer = await this.getInquirer();
      const { confirm } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to delete this entry?',
        default: false
      });

      if (confirm) {
        const deleted = await this.journalManager.deleteEntry(id!, this.currentPassword);
        if (deleted) {
          console.log(chalk.green('✓ Entry deleted successfully!'));
        } else {
          console.log(chalk.red('Failed to delete entry.'));
        }
      } else {
        console.log(chalk.gray('Delete cancelled.'));
      }

    } catch (error) {
      console.error(chalk.red('Failed to delete entry:'), error);
    }
  }

  /**
   * Creates a backup
   */
  async createBackup(outputPath?: string): Promise<void> {
    if (!await this.authManager.isInitialized()) {
      console.log(chalk.red('Journal not initialized. Run "emotionctl init" first.'));
      return;
    }

    if (!await this.authenticate()) {
      return;
    }

    try {
      const backupPath = await this.journalManager.createBackup(this.currentPassword, outputPath);
      console.log(chalk.green('✓ Backup created successfully!'));
      console.log(chalk.gray(`Backup saved to: ${backupPath}`));
    } catch (error) {
      console.error(chalk.red('Failed to create backup:'), error);
    }
  }

  /**
   * Restores from backup
   */
  async restoreBackup(inputPath?: string): Promise<void> {
    if (!inputPath) {
      console.log(chalk.red('Please provide the backup file path with --input'));
      return;
    }

    console.log(chalk.yellow('⚠️  Warning: This will overwrite your current journal!'));

    const inquirer = await this.getInquirer();
    const { confirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to restore from backup?',
      default: false
    });

    if (!confirm) {
      console.log(chalk.gray('Restore cancelled.'));
      return;
    }

    const password = await this.promptPassword();

    try {
      await this.journalManager.restoreFromBackup(inputPath, password);
      console.log(chalk.green('✓ Journal restored successfully!'));
    } catch (error) {
      console.error(chalk.red('Failed to restore backup:'), error);
    }
  }

  /**
   * Changes the password
   */
  async changePassword(): Promise<void> {
    if (!await this.authManager.isInitialized()) {
      console.log(chalk.red('Journal not initialized. Run "emotionctl init" first.'));
      return;
    }

    const currentPassword = await this.promptPassword();
    console.log(chalk.blue('Enter your new password:'));
    const newPassword = await this.promptPassword(true);

    try {
      await this.authManager.changePassword(currentPassword, newPassword);
      this.currentPassword = newPassword;

      // Re-encrypt all entries with new password
      await this.journalManager.load(newPassword);

      console.log(chalk.green('✓ Password changed successfully!'));
    } catch (error) {
      console.error(chalk.red('Failed to change password:'), error);
    }
  }

  /**
   * Interactive mode
   */
  async interactiveMode(): Promise<void> {
    this.displayBanner();

    if (!await this.authManager.isInitialized()) {
      console.log(chalk.yellow('Journal not initialized. Let\'s set it up!'));
      await this.initializeJournal();
      return;
    }

    if (!await this.authenticate()) {
      return;
    }

    const stats = this.journalManager.getStats();
    console.log(chalk.green('Welcome back! 📖'));
    console.log(chalk.gray(`Total entries: ${stats.totalEntries}`));
    console.log(chalk.gray(`Average words per entry: ${stats.avgWordsPerEntry}`));
    console.log();

    while (true) {
      const inquirer = await this.getInquirer();
      const { action } = await inquirer.prompt({
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '📝 Write new entry', value: 'write' },
          { name: '📖 Read entries', value: 'read' },
          { name: '✏️  Edit entry', value: 'edit' },
          { name: '🔍 Search entries', value: 'search' },
          { name: '🗑️  Delete entry', value: 'delete' },
          { name: '💾 Create backup', value: 'backup' },
          { name: '🔧 Change password', value: 'password' },
          { name: '📊 View statistics', value: 'stats' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      });

      try {
        switch (action) {
          case 'write':
            this.displayBanner();
            await this.writeEntry();
            break;
          case 'read':
            this.displayBanner();
            await this.readEntries({ list: true });
            break;
          case 'edit':
            this.displayBanner();
            await this.editEntry();
            break;
          case 'search':
            this.displayBanner();
            const inquirer1 = await this.getInquirer();
            const { searchTerm } = await inquirer1.prompt({
              type: 'input',
              name: 'searchTerm',
              message: 'Enter search term:'
            });
            await this.readEntries({ search: searchTerm });
            break;
          case 'delete':
            this.displayBanner();
            await this.deleteEntry();
            break;
          case 'backup':
            await this.createBackup();
            break;
          case 'password':
            this.displayBanner();
            await this.changePassword();
            break;
          case 'stats':
            this.displayBanner();
            this.displayStats();
            break;
          case 'exit':
            this.displayBanner();
            console.log(chalk.blue('Goodbye! 👋'));
            return;
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error);
      }

      console.log(); // Add spacing between actions
    }
  }

  /**
   * Displays journal statistics
   */
  private displayStats(): void {
    const stats = this.journalManager.getStats();

    console.log(chalk.cyan('\n📊 Journal Statistics'));
    console.log(chalk.cyan('─────────────────────'));
    console.log(`Total entries: ${chalk.bold(stats.totalEntries.toString())}`);
    console.log(`Average words per entry: ${chalk.bold(stats.avgWordsPerEntry.toString())}`);

    if (stats.oldestEntry) {
      console.log(`Oldest entry: ${chalk.bold(format(stats.oldestEntry, 'PPP'))}`);
    }

    if (stats.newestEntry) {
      console.log(`Newest entry: ${chalk.bold(format(stats.newestEntry, 'PPP'))}`);
    }

    console.log();
  }

  /**
   * Resets the journal (deletes all data)
   */
  async resetJournal(): Promise<void> {
    this.displayBanner();

    console.log(chalk.red('⚠️  WARNING: This will permanently delete all journal data!'));
    console.log(chalk.gray('This action cannot be undone unless you have a backup.'));
    console.log();

    const inquirer = await this.getInquirer();
    const { confirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you absolutely sure you want to reset your journal?',
      default: false
    });

    if (!confirm) {
      console.log(chalk.gray('Reset cancelled.'));
      return;
    }

    const { doubleConfirm } = await inquirer.prompt({
      type: 'input',
      name: 'doubleConfirm',
      message: 'Type "DELETE MY JOURNAL" to confirm:',
      validate: (input: string) => input === 'DELETE MY JOURNAL' || 'You must type exactly "DELETE MY JOURNAL" to confirm'
    });

    if (doubleConfirm === 'DELETE MY JOURNAL') {
      try {
        const configDir = this.authManager.getConfigDir();
        await require('fs-extra').remove(configDir);
        console.log(chalk.green('✓ Journal reset successfully!'));
        console.log(chalk.gray('You can now run "emotionctl init" to create a new journal.'));
      } catch (error) {
        console.error(chalk.red('Failed to reset journal:'), error);
      }
    } else {
      console.log(chalk.gray('Reset cancelled.'));
    }
  }

  /**
   * Opens the built-in editor for content input
   */
  private async openEditor(initialContent: string = ''): Promise<string> {
    try {
      console.log(chalk.blue('Opening built-in editor...'));
      console.log(chalk.gray('Use Ctrl+X to save and exit, Ctrl+G for help'));
      console.log();

      const editor = new Editor();
      const content = await editor.edit(initialContent);

      console.log(chalk.green('Editor closed.'));
      return content;
    } catch (error) {
      throw new Error(`Failed to open editor: ${error}`);
    }
  }
}
