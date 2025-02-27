import { App, Plugin, TFolder, TFile, FuzzySuggestModal, Notice } from 'obsidian';
import { FileOrganizerSettings, FileOrganizerSettingTab, DEFAULT_SETTINGS, CommandConfig } from './settings';
import { parse, stringify } from 'yaml';

export default class FileOrganizerPlugin extends Plugin {
	settings: FileOrganizerSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new FileOrganizerSettingTab(this.app, this));

		// Register commands
		this.registerCommands();

		// Only register archive commands when enabled
		if (this.settings.enableArchive) {
			this.addCommand({
				id: 'archive-file',
				name: 'Archive current file',
				callback: () => this.handleArchive()
			});

			this.addCommand({
				id: 'unarchive-file',
				name: 'Unarchive current file',
				callback: () => this.handleUnarchive()
			});
		}
	}

	async handleArchive() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice('No active file');
			return;
		}

		// Get path relative to vault root
		const relativePath = file.path;
		const archivePath = `${this.settings.archiveDir}/${relativePath}`;

		// Ensure target directory exists
		await this.ensureDirectory(archivePath);

		// Move file
		await this.app.fileManager.renameFile(file, archivePath);

		// Update tags
		await this.updateArchiveTag(file, true);
	}

	async handleUnarchive() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice('No active file');
			return;
		}

		// Check if file is in archive directory
		if (!file.path.startsWith(this.settings.archiveDir)) {
			new Notice('File is not in archive directory');
			return;
		}

		// Get path relative to archive directory
		const relativePath = file.path.replace(this.settings.archiveDir + '/', '');

		// Ensure target directory exists
		await this.ensureDirectory(relativePath);

		// Move file
		await this.app.fileManager.renameFile(file, relativePath);

		// Update tags
		await this.updateArchiveTag(file, false);
	}

	private async ensureDirectory(filePath: string) {
		const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
		if (dirPath) {
			await this.app.vault.createFolder(dirPath).catch(() => {});
		}
	}

	private async updateArchiveTag(file: TFile, isArchive: boolean) {
		const content = await this.app.vault.read(file);
		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;

		if (frontmatter) {
			const match = content.match(/^---\n([\s\S]*?)\n---/);
			if (!match) return;

			const yamlContent = parse(match[1]);
			let tags = yamlContent.tags || [];
			if (typeof tags === 'string') {
				tags = [tags];
			}

			// Update tags
			tags = tags.map((tag: string) => {
				if (tag.startsWith(this.settings.paraTag + '/')) {
					if (isArchive && !tag.includes('/archive/')) {
						// Add archive after para tag
						const parts = tag.split('/');
						parts.splice(1, 0, 'archive');
						return parts.join('/');
					} else if (!isArchive && tag.includes('/archive/')) {
						// Remove archive part
						return tag.replace('/archive', '');
					}
				}
				return tag;
			});

			yamlContent.tags = tags;
			const newYaml = stringify(yamlContent);
			const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`);
			await this.app.vault.modify(file, newContent);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.registerCommands();
	}

	registerCommands() {
		// Clear previous commands
		this.app.commands.commands = Object.fromEntries(
			Object.entries(this.app.commands.commands)
				.filter(([id]) => !id.startsWith('file-organizer:'))
		);

		// Register new commands
		this.settings.commands.forEach((command) => {
			this.addCommand({
				id: `file-organizer:${command.command}`,
				name: command.command,
				callback: () => this.handleCommand(command)
			});
		});
	}

	async handleCommand(command: CommandConfig) {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice('No active file');
			return;
		}

		const baseFolder = this.app.vault.getAbstractFileByPath(command.directory);
		if (!baseFolder || !(baseFolder instanceof TFolder)) {
			new Notice('Invalid base directory');
			return;
		}

		new FolderSelectionModal(this.app, baseFolder, async (selectedFolder) => {
			await this.moveFileAndUpdateTags(file, selectedFolder, command);
		}).open();
	}

    async moveFileAndUpdateTags(file: TFile, targetFolder: TFolder, command: CommandConfig) {
        console.info('moveFileAndUpdateTags', targetFolder.path, targetFolder.name);
        // Move file to target directory
        const newPath = `${targetFolder.path}/${file.name}`;
        await this.app.fileManager.renameFile(file, newPath);

        // Update tags
        const fileContent = await this.app.vault.read(file);
        const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
        const newTag = targetFolder.path == targetFolder.name ? `${this.settings.paraTag}/${command.tag}` : `${this.settings.paraTag}/${command.tag}/${targetFolder.name}`;

        let newContent;
        if (frontmatter) {
            // Extract frontmatter section
            const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
            if (match) {
                // Parse YAML
                const yamlContent = parse(match[1]);
                let tags = yamlContent.tags || [];
                if (typeof tags === 'string') {
                    tags = [tags];
                }

                // Remove old para tags
                tags = tags.filter((tag: string) => !tag.startsWith(this.settings.paraTag + '/'));
                tags.push(newTag);

                // Update YAML object
                yamlContent.tags = tags;

                // Convert back to YAML string
                const newYaml = stringify(yamlContent);
                newContent = fileContent.replace(/^---\n[\s\S]*?\n---/, `---\n${newYaml}---`);
            } else {
                // Invalid frontmatter format, create new one
                const yamlContent = { tags: [newTag] };
                const newYaml = stringify(yamlContent);
                newContent = `---\n${newYaml}---\n${fileContent}`;
            }
        } else {
            // No frontmatter, create new one
            const yamlContent = { tags: [newTag] };
            const newYaml = stringify(yamlContent);
            newContent = `---\n${newYaml}---\n${fileContent}`;
        }

        await this.app.vault.modify(file, newContent);
    }
}

class FolderSelectionModal extends FuzzySuggestModal<TFolder> {
	baseFolder: TFolder;
	onChoose: (folder: TFolder) => void;

	constructor(app: App, baseFolder: TFolder, onChoose: (folder: TFolder) => void) {
		super(app);
		this.baseFolder = baseFolder;
		this.onChoose = onChoose;
	}

	getItems(): TFolder[] {
		const folders: TFolder[] = [this.baseFolder];
		this.getAllSubfolders(this.baseFolder, folders);
		return folders;
	}

	getAllSubfolders(folder: TFolder, folders: TFolder[]) {
		folder.children.forEach((child) => {
			if (child instanceof TFolder) {
				folders.push(child);
				this.getAllSubfolders(child, folders);
			}
		});
	}

	getItemText(folder: TFolder): string {
		return folder.path;
	}

	onChooseItem(folder: TFolder): void {
		this.onChoose(folder);
	}
}
