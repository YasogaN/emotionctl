import * as blessed from 'blessed';

export class Editor {
  private screen: blessed.Widgets.Screen;
  private textBox: blessed.Widgets.TextareaElement;
  private helpText: blessed.Widgets.BoxElement;
  private content: string = '';
  private resolved: boolean = false;

  constructor() {
    // Create blessed screen with better Windows compatibility
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'EmotionCtl Editor',
      cursor: {
        artificial: true,
        shape: 'line',
        blink: true,
        color: 'white'
      },
      debug: false,
      warnings: false,
      autoPadding: true,
      fastCSR: true
    });

    // Create main text area with simplified input handling
    this.textBox = blessed.textarea({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%-3',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'cyan'
        },
        focus: {
          border: {
            fg: 'green'
          }
        }
      },
      scrollable: true,
      alwaysScroll: true,
      mouse: false,
      keys: true,
      vi: false,
      wrap: true,
      label: ' EmotionCtl Editor - Express yourself freely '
    });

    // Create help text at bottom
    this.helpText = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: '  ^X Exit and Save    ^G Get Help    ^O Write Out    ^W Where Is',
      style: {
        bg: 'blue',
        fg: 'white'
      },
      tags: false
    });

    this.setupKeyBindings();
  }

  private setupKeyBindings(): void {
    // Only bind specific control keys to avoid interfering with normal typing
    // Ctrl+X - Exit and save
    this.screen.key(['C-x'], () => {
      this.saveAndExit();
    });

    // Ctrl+G - Show help
    this.screen.key(['C-g'], () => {
      this.showHelp();
    });

    // Ctrl+O - Write out (save)
    this.screen.key(['C-o'], () => {
      this.save();
    });

    // Ctrl+C - Cancel without saving
    this.screen.key(['C-c'], () => {
      this.cancelEdit();
    });

    // ESC - Cancel without saving
    this.screen.key(['escape'], () => {
      this.cancelEdit();
    });

    // Focus the text box initially
    this.textBox.focus();
  }

  private saveAndExit(): void {
    this.content = this.textBox.getValue();
    this.cleanup();
  }

  private save(): void {
    this.content = this.textBox.getValue();
    // Show save confirmation briefly
    this.helpText.setContent('  File saved! Press Ctrl+X to exit or continue editing...');
    this.screen.render();

    setTimeout(() => {
      this.helpText.setContent('  ^X Exit and Save    ^G Get Help    ^O Write Out    ^W Where Is');
      this.screen.render();
    }, 2000);
  }

  private cancelEdit(): void {
    if (this.textBox.getValue().trim() === '') {
      this.content = '';
      this.cleanup();
      return;
    }

    // Ask for confirmation if there's content
    const confirmBox = blessed.question({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 50,
      height: 7,
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'red'
        }
      },
      label: ' Confirm Exit '
    });

    confirmBox.ask('Exit without saving? (y/N)', (err, value) => {
      if (value && value.toLowerCase() === 'y') {
        this.content = '';
        this.cleanup();
      } else {
        this.screen.remove(confirmBox);
        this.textBox.focus();
        this.screen.render();
      }
    });
  }

  private showHelp(): void {
    const helpBox = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'cyan'
        }
      },
      label: ' EmotionCtl Editor Help ',
      content: `
  Welcome to the EmotionCtl nano-like editor!
  
  This is your safe space for expressing emotions and thoughts.
  
  Key Bindings:
  
  ^X  Exit and Save       - Save your entry and close the editor
  ^O  Write Out          - Save your current work (without exiting)
  ^G  Get Help           - Show this help screen
  ^C  Cancel             - Exit without saving (with confirmation)
  ESC Cancel             - Exit without saving (with confirmation)
  
  Navigation:
  - Use arrow keys to move the cursor
  - Page Up/Page Down for scrolling
  - Home/End for beginning/end of line
  
  Tips:
  - Your thoughts are automatically wrapped to fit the screen
  - This is a judgment-free zone - express yourself freely
  - Take your time - there's no rush
  
  Remember: Every step in processing your emotions is progress. 💙
  
  Press any key to continue...`,
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      mouse: true
    });

    helpBox.key(['*'], () => {
      this.screen.remove(helpBox);
      this.textBox.focus();
      this.screen.render();
    });

    helpBox.focus();
    this.screen.render();
  }

  private cleanup(): void {
    if (!this.resolved) {
      this.resolved = true;
      this.screen.destroy();
    }
  }

  /**
   * Opens the editor and returns the content when user saves and exits
   */
  public async edit(initialContent: string = ''): Promise<string> {
    return new Promise<string>((resolve) => {
      // Set initial content
      this.textBox.setValue(initialContent);

      // Focus and render
      this.textBox.focus();
      this.screen.render();

      // Handle screen destruction
      this.screen.on('destroy', () => {
        if (!this.resolved) {
          this.resolved = true;
          resolve(this.content);
        }
      });

      // Handle process exit
      const handleExit = () => {
        this.cleanup();
        resolve('');
      };

      process.on('SIGINT', handleExit);
      process.on('SIGTERM', handleExit);

      // Resolve when screen is destroyed
      const checkDestroyed = () => {
        if (this.resolved) {
          resolve(this.content);
        } else {
          setTimeout(checkDestroyed, 100);
        }
      };
      checkDestroyed();
    });
  }
}
