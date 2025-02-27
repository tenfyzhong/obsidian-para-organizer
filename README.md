# Para Org Plugin for Obsidian

A plugin for Obsidian that helps organize files into different directories while maintaining consistent tag structures.

## Features

- **File Organization**: Move files to different directories with a single command
- **Automatic Tagging**: Automatically add structured tags when moving files
- **Archive System**: Optional archive feature to manage inactive files
- **Customizable Commands**: Create custom commands for different organization needs

## Usage

### Basic Organization
1. Configure your commands in the settings:
   - **Command Name**: The name that will appear in the command palette
   - **Directory**: The target directory where files will be moved
   - **Tag**: The tag that will be added to the file

2. Use the commands from the command palette to:
   - Move files to specific directories
   - Automatically add structured tags

### Archive Feature
When enabled, provides two additional commands:
- **Archive**: Move files to an archive directory while maintaining the directory structure
- **Unarchive**: Restore files from the archive to their original locations

## Configuration

### Para Tag
- Set the prefix tag that will be used for all file organization
- Example: if para tag is "para", tags will be structured as "para/type/location"

### Archive Settings
- Enable/Disable archive feature
- Configure archive directory location

### Command Configuration
Create multiple commands for different organization needs:
- Project files
- Area documents
- Resource materials
- Inbox processing

## Example Setup

1. Set "para" as your para tag
2. Create commands like:
   - Project files: Move to "10-Projects" with tag "project"
   - Area files: Move to "20-Areas" with tag "area"
   - Resources: Move to "30-Resources" with tag "resource"
   - Inbox: Move to "00-Inbox" with tag "inbox"

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Para Org"
4. Install and Enable the plugin
5. Configure your settings

## License

MIT License
