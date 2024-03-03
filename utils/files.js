import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const extensionName = 'quicknotes@chesnoksatan';

export function* getCurrentUserNotes() {
    let notesDirectory = Gio.File.new_for_path(GLib.get_user_data_dir() + '/' + extensionName);
    if (!notesDirectory.query_exists(null)) {
        log('The current user has no notes yet');
        notesDirectory.make_directory_with_parents(null);
    }

    let fileEnum = notesDirectory.enumerate_children('standard::name,standard::type', 0, null);;

    let info;
    while ((info = fileEnum.next_file(null)))
        yield info;
}

export function deleteNote(info) {
    let notesDirectory = Gio.File.new_for_path(GLib.get_user_data_dir() + '/' + extensionName);
    const note = notesDirectory.get_child(info.get_name());

    try {
        note.delete(null);
        log(`Note '${info.get_name()}' deleted successfully.`);
    } catch (error) {
        logError(`Error deleting note '${info.get_name()}': ${error.message}`);
    }
}

export function createNote(noteName) {
    try {
        let notesDirectory = Gio.File.new_for_path(GLib.get_user_data_dir() + '/' + extensionName);
        const file = notesDirectory.get_child(noteName);
        file.create(Gio.FileCreateFlags.NONE, null);

        print(`Note '${noteName}' created successfully.`);
        return file.query_info(
            'standard::*',
            Gio.FileQueryInfoFlags.NONE,
            null,
        );
    } catch (error) {
        print(`Error creating note '${noteName}': ${error.message}`);
        return null;
    }
}

export function openNote(info) {
    try {
        let notesDirectory = Gio.File.new_for_path(GLib.get_user_data_dir() + '/' + extensionName);
        const note = notesDirectory.get_child(info.get_name());
        let appInfo = Gio.AppInfo.launch_default_for_uri(note.get_uri(), global.create_app_launch_context(0, -1));

        if (!appInfo) {
            log(`Could not find an application to open ${info.get_name()}`);
        }
    } catch (error) {
        logError(error, `Error opening ${info.get_name()}`);
    }
}