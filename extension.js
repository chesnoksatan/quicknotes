/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const { Clutter, St, GObject } = imports.gi;

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import * as Files from './utils/files.js';

function logger(str) {
    console.log("[EXTENSION QuickNotes] " + str)
}

export default class QuickNotesExtension extends Extension {
    enable() {
        logger("Loading ...");
        let start = +Date.now();

        this._indicator = new PanelMenu.Button(0.0, this.metadata.name);
        this._indicator.add_child(new St.Icon({
            icon_name: 'notes-app-symbolic',
            style_class: 'system-status-icon',
        }));

        this._notes = [...Files.getCurrentUserNotes()];

        const menu = new PopupMenu.PopupMenuSection()
        const scrollView = new St.ScrollView();
        scrollView.add_actor(menu.actor);

        menu.addMenuItem(this._makeAddItem());
        if (this._notes.length > 0) {
            menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        this._notes.forEach(note => {
            menu.addMenuItem(new NoteItem(note));
        });

        this._indicator.menu.box.add_child(scrollView);
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        logger("Loaded. " + (+Date.now() - start) + "ms taken")
    }

    _makeAddItem() {
        let itemLabel = new St.Label({ 
            text: "Add Note", 
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        
        let icon = new St.Icon({ 
            icon_name: 'list-add-symbolic', 
            style_class: 'popup-menu-item-icon', 
            icon_size: 16, 
        });
    
        let menuItem = new PopupMenu.PopupBaseMenuItem({});
        menuItem.add(icon);
        menuItem.add(itemLabel);

        menuItem.connect('activate', () => {
            let promtDialog = new PromtDialog();

            promtDialog.connect('create', (_, noteName) => {
                const note = Files.createNote(noteName);
                
                if (note) {
                    logger(note);
                    logger(note.get_name());
                    this._indicator.menu.addMenuItem(new NoteItem(note))
                    Files.openNote(note);
                }
            });

            promtDialog.open();
        });

        return menuItem;
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
        logger("Diabled");
    }
}

var PromtDialog = GObject.registerClass({
    Signals: {
        'create': {param_types: [GObject.TYPE_STRING]},
    },
}, class PromtDialog extends ModalDialog.ModalDialog {
    _init() {
        super._init({
            destroyOnClose: true,
            styleClass: 'my-dialog',
        });

        const label = new St.Label({ 
            text: "Add New Note",
            x_align: Clutter.ActorAlign.CENTER,
        });

        let textField = new St.Entry({
            x_expand: true,
            can_focus: true,
        });

        this.contentLayout.add_child(label);
        this.contentLayout.add_child(textField);

        this.setButtons([
            {
                label: 'Close',
                action: () => this.destroy(),
            },
            {
                label: 'Add Note',
                action: () => {
                    this.close(global.get_current_time());
                    this.emit('create', textField.get_text());
                },
            },
        ]);

        this.contentLayout.set_width(200);
    }
});

var NoteItem = GObject.registerClass({
}, class NoteItem extends PopupMenu.PopupBaseMenuItem {
    _init(fileInfo, params) {
        super._init(params);

        this.note = fileInfo;

        this.label = new St.Label({ 
            text: fileInfo.get_name(), 
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        const deleteIcon = new St.Icon({ 
            icon_name: 'trash-symbolic', 
            style_class: 'popup-menu-item-icon', 
            icon_size: 16, 
        });

        this.deleteButton = new St.Button();
        this.deleteButton.set_child(deleteIcon);
        this.deleteButton.connect('clicked', () => {
            Files.deleteNote(fileInfo);
            this.destroy();
        });

        this.connect('activate', () => Files.openNote(fileInfo));

        this.add_child(this.label);
        this.add_child(this.deleteButton);
    }
});
