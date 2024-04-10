import { addIcon, App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// The official "Z" icon scaled from 16x16 to 24x24
const ICON_OFFICIAL_SCALED = '<?xml version="1.0" encoding="UTF-8"?> \
<svg version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> \
<polygon transform="matrix(1.5 0 0 1.5 .636 0)" points="13.863 12.142 13.863 \
12.021 6.448 12.021 13.863 2.73 13.027 1 2.137 1 2.137 3.8 2.137 3.921 8.822 \
3.921 1.289 13.233 2.137 15 13.863 15" fill="#db2c3a" stroke-width="1.3333"/> \
</svg>';

interface ZoterkastenSettings {
	read_only_api_key: string;
	emit_records_to_console: boolean
}

const DEFAULT_SETTINGS: ZoterkastenSettings = {
	read_only_api_key: '',
	emit_records_to_console: false
}

export default class Zoterkasten extends Plugin {
	settings: ZoterkastenSettings;

	getSettingLogging(): boolean {
		return this.settings.emit_records_to_console;
	}

	setSettingLogging(value: boolean): void {
		this.settings.emit_records_to_console = value;
		console.log('Logging is %sabled', (value) ? ('en') : ('dis'));
	}

	async onload() {
		await this.loadSettings();

		// This adds the official Zotero icon.
		addIcon('Z', ICON_OFFICIAL_SCALED)

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('Z', 'Zoterkasten', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ZoterkastenSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

// Hardcoded values for Zotero API key setting parameters
const SETTING_API_KEY_NAME = 'Zotero (Read-Only) API Key';
const SETTING_API_KEY_HOLD = 'Enter your key here';
const SETTING_API_KEY_EMIT = 'Set API key as %s';
const SETTING_API_KEY_DESC = 'You can generate a new key at \
https://www.zotero.org/settings/keys/new if you do not already have one. \
Please read carefully the available policy options and specify read-only \
access only to the libraries you wish to expose.';

// Hardcoded values for console logging setting parameters
const SETTING_LOGGING_NAME = 'Enable Logging';
const SETTING_LOGGING_DESC = 'This emits logging messages to the console. To \
view the output, click on the Console tab in the Developer Tools window by \
pressing Ctrl+Shift+I in Windows or Linux, or Cmd-Option-I on macOS.'

class ZoterkastenSettingTab extends PluginSettingTab {
	plugin: Zoterkasten;

	constructor(app: App, plugin: Zoterkasten) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(SETTING_API_KEY_NAME)
			.setDesc(SETTING_API_KEY_DESC)
			.addText(text => text
				.setPlaceholder(SETTING_API_KEY_HOLD)
				.setValue(this.plugin.settings.read_only_api_key)
				.onChange(async (value) => {
					this.plugin.settings.read_only_api_key = value;
					await this.plugin.saveSettings();
					if (this.plugin.getSettingLogging()) {
						console.log(SETTING_API_KEY_EMIT, (value) ? (value) : ('NULL'));
					}
				}));

		new Setting(containerEl).setName('Debug').setHeading();

		new Setting(containerEl)
			.setName(SETTING_LOGGING_NAME)
			.setDesc(SETTING_LOGGING_DESC)
			.addToggle(comp => comp
				.setValue(this.plugin.getSettingLogging())
				.onChange(async (value) => {
					this.plugin.setSettingLogging(value);
					await this.plugin.saveSettings();
				}));
	}
}
