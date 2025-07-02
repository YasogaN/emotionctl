import * as readline from 'readline';

export class Editor {
  private content: string = '';
  private lines: string[] = [];
  private resolved: boolean = false;

  constructor() {
    // Simple constructor - no setup needed for this approach
  }

  private clearScreen(): void {
    process.stdout.write('\x1b[2J\x1b[0f');
  }

  private displayContent(): void {
    this.clearScreen();
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    EmotionCtl Editor                         ║');
    console.log('║           Your Safe Space for Emotional Expression           ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║ Commands:                                                    ║');
    console.log('║   :save  - Save and exit                                     ║');
    console.log('║   :quit  - Exit without saving                               ║');
    console.log('║   :help  - Show this help                                    ║');
    console.log('║   Enter empty line to finish typing                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log();

    if (this.lines.length > 0) {
      console.log('Current content:');
      console.log('─'.repeat(60));
      this.lines.forEach((line, index) => {
        console.log(`${(index + 1).toString().padStart(3)}: ${line}`);
      });
      console.log('─'.repeat(60));
      console.log();
    }
  }

  private async showHelp(): Promise<void> {
    this.clearScreen();
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    EmotionCtl Editor Help                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log();
    console.log('This is your safe space for expressing emotions and thoughts.');
    console.log();
    console.log('How to use:');
    console.log('• Type your content line by line');
    console.log('• Press Enter to go to the next line');
    console.log('• Enter an empty line to stop adding content');
    console.log('• Use :save to save and exit');
    console.log('• Use :quit to exit without saving');
    console.log('• Use :help to see this help again');
    console.log();
    console.log('Remember: Every step in processing your emotions is progress. 💙');
    console.log();
    console.log('Press Enter to continue...');

    return new Promise<void>((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
  }

  /**
   * Opens the editor and returns the content when user saves and exits
   */
  public async edit(initialContent: string = ''): Promise<string> {
    return new Promise<string>(async (resolve) => {
      this.lines = initialContent ? initialContent.split('\n') : [];

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const processInput = async (input: string) => {
        const trimmedInput = input.trim();

        // Handle commands
        if (trimmedInput.startsWith(':')) {
          switch (trimmedInput.toLowerCase()) {
            case ':save':
              this.content = this.lines.join('\n');
              rl.close();
              resolve(this.content);
              return;

            case ':quit':
              if (this.lines.length > 0) {
                rl.question('Exit without saving? (y/N): ', (answer) => {
                  if (answer.toLowerCase() === 'y') {
                    rl.close();
                    resolve('');
                  } else {
                    this.displayContent();
                    rl.prompt();
                  }
                });
                return;
              } else {
                rl.close();
                resolve('');
                return;
              }

            case ':help':
              await this.showHelp();
              this.displayContent();
              rl.prompt();
              return;

            default:
              console.log(`Unknown command: ${trimmedInput}`);
              console.log('Available commands: :save, :quit, :help');
              rl.prompt();
              return;
          }
        }

        // Handle empty line (finish input)
        if (trimmedInput === '') {
          if (this.lines.length === 0) {
            console.log('No content entered. Use :quit to exit or start typing.');
            rl.prompt();
            return;
          }

          console.log();
          console.log('Content entry finished. Use :save to save and exit, or :quit to exit without saving.');
          rl.prompt();
          return;
        }

        // Add the line to content
        this.lines.push(input);
        rl.prompt();
      };

      // Set up the readline interface
      rl.on('line', processInput);

      rl.on('close', () => {
        if (!this.resolved) {
          this.resolved = true;
          resolve(this.content);
        }
      });

      // Handle Ctrl+C
      rl.on('SIGINT', () => {
        console.log('\nUse :quit to exit or :save to save and exit');
        rl.prompt();
      });

      // Start the editor
      this.displayContent();
      console.log('Start typing your entry (press Enter after each line):');
      rl.prompt();
    });
  }
}
