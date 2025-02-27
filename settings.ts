import { App, PluginSettingTab, Setting } from 'obsidian';
import FileOrganizerPlugin from './main';

export interface CommandConfig {
    command: string;
    directory: string;
    tag: string;
}

export interface FileOrganizerSettings {
    paraTag: string;
    archiveDir: string;
    enableArchive: boolean;
    commands: CommandConfig[];
}

export const DEFAULT_SETTINGS: FileOrganizerSettings = {
    paraTag: 'para',
    archiveDir: 'archive',
    enableArchive: true,
    commands: []
}

export class FileOrganizerSettingTab extends PluginSettingTab {
    plugin: FileOrganizerPlugin;

    constructor(app: App, plugin: FileOrganizerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Para Tag')
            .setDesc('The prefix tag for organizing files')
            .addText(text => text
                .setPlaceholder('Enter para tag')
                .setValue(this.plugin.settings.paraTag)
                .onChange(async (value) => {
                    this.plugin.settings.paraTag = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable Archive Feature')
            .setDesc('Enable archive and unarchive commands')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableArchive)
                .onChange(async (value) => {
                    this.plugin.settings.enableArchive = value;
                    await this.plugin.saveSettings();
                    // Re-render settings page to show/hide archive directory config
                    this.display();
                }));

        // Only show directory config when archive feature is enabled
        if (this.plugin.settings.enableArchive) {
            new Setting(containerEl)
                .setName('Archive Directory')
                .setDesc('The directory for archived files')
                .addText(text => text
                    .setPlaceholder('Enter archive directory')
                    .setValue(this.plugin.settings.archiveDir)
                    .onChange(async (value) => {
                        this.plugin.settings.archiveDir = value;
                        await this.plugin.saveSettings();
                    }));
        }

        containerEl.createEl('h3', { text: 'Command Configurations', cls: 'command-config-title' });

        const descEl = containerEl.createEl('div', { cls: 'setting-item-description command-config-desc' });
        descEl.createEl('p', {
            text: 'Command: The name of the command that will appear in the command palette',
            cls: 'command-desc-item'
        });
        descEl.createEl('p', {
            text: 'Directory: The target directory where files will be moved to',
            cls: 'command-desc-item'
        });
        descEl.createEl('p', {
            text: 'Tag: The tag that will be added to the file (will be prefixed with para tag)',
            cls: 'command-desc-item'
        });

        // const headerDiv = containerEl.createEl('div', { cls: 'setting-item setting-item-heading' });
        // const headerControl = headerDiv.createEl('div', { cls: 'setting-item-control command-table-header' });
        // headerControl.createEl('span', { text: 'Command Name', cls: 'setting-header-name' });
        // headerControl.createEl('span', { text: 'Directory', cls: 'setting-header-name' });
        // headerControl.createEl('span', { text: 'Tag', cls: 'setting-header-name' });

        this.plugin.settings.commands.forEach((command, index) => {
            const div = containerEl.createEl('div');
            new Setting(div)
                .addText(text => text
                    .setPlaceholder('Command name')
                    .setValue(command.command)
                    .onChange(async (value) => {
                        this.plugin.settings.commands[index].command = value;
                        await this.plugin.saveSettings();
                    }))
                .addText(text => text
                    .setPlaceholder('Directory')
                    .setValue(command.directory)
                    .onChange(async (value) => {
                        this.plugin.settings.commands[index].directory = value;
                        await this.plugin.saveSettings();
                    }))
                .addText(text => text
                    .setPlaceholder('Tag')
                    .setValue(command.tag)
                    .onChange(async (value) => {
                        this.plugin.settings.commands[index].tag = value;
                        await this.plugin.saveSettings();
                    }))
                .addButton(btn => btn
                    .setButtonText('Delete')
                    .onClick(async () => {
                        this.plugin.settings.commands.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    }));
        });

        new Setting(containerEl)
            .setName('Add Command')
            .addButton(btn => btn
                .setButtonText('Add')
                .onClick(async () => {
                    this.plugin.settings.commands.push({
                        command: '',
                        directory: '',
                        tag: ''
                    });
                    await this.plugin.saveSettings();
                    this.display();
                }));
    }
}
