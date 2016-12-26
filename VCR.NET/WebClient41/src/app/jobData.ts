﻿namespace VCRNETClient.App {

    // Beschreibt die Daten eines Auftrags
    export class JobData {
        constructor(existingData: VCRServer.JobScheduleInfoContract, defaultProfile: string, onChange: () => void, devices: NoUi.ISelectableValue<string>[], folders: NoUi.ISelectableValue<string>[]) {
            // Pflegekomponenten erstellen
            this.nameEditor = new NoUi.StringEditor(this, "name", onChange, true);
            this.channelSelector = new NoUi.ChannelEditor(this, "sourceName", onChange);
            this.lockedEditor = new NoUi.BooleanEditor(this, "lockedToDevice", onChange);
            this.deviceEditor = new NoUi.StringListEditor(this, "device", onChange, true, devices);
            this.folderEditor = new NoUi.StringListEditor(this, "directory", onChange, false, folders);

            // Schauen wir mal, ob wir etwas ändern sollen
            if (existingData != null) {
                // Auftragsdaten müssen vorhanden sein
                var rawData = existingData.job;
                if (rawData != null) {
                    // Da gibt es schon etwas für uns vorbereitetes
                    this.lockedToDevice = rawData.lockedToDevice;
                    this.withSubtitles = rawData.withSubtitles;
                    this.withVideotext = rawData.withVideotext;
                    this.allLanguages = rawData.allLanguages;
                    this.includeDolby = rawData.includeDolby;
                    this.sourceName = rawData.sourceName;
                    this.directory = rawData.directory;
                    this.id = existingData.jobId;
                    this.device = rawData.device;
                    this.name = rawData.name;

                    return;
                }
            }

            // Ein ganz neuer Auftrag
            this.withSubtitles = VCRServer.UserProfile.global.defaultDVBSubtitles;
            this.allLanguages = VCRServer.UserProfile.global.defaultAllLanguages;
            this.withVideotext = VCRServer.UserProfile.global.defaultVideotext;
            this.includeDolby = VCRServer.UserProfile.global.defaultDolby;
            this.device = defaultProfile;
            this.lockedToDevice = false;
            this.sourceName = '';
            this.directory = '';
            this.name = '';
            this.id = null;
        }

        // Die Kennung des Auftrags - leer bei neuen Aufträgen.
        id: string;

        // Der Name des Auftrags.
        name: string;

        readonly nameEditor: NoUi.StringEditor;

        // Das Aufzeichnungsverzeichnis.
        directory: string;

        readonly folderEditor: NoUi.StringListEditor;

        // Das zu verwendende DVB Gerät.
        device: string;

        readonly deviceEditor: NoUi.StringListEditor;

        // Gesetzt, wenn die Aufzeichnung immer auf dem Gerät stattfinden soll.
        lockedToDevice: boolean;

        readonly lockedEditor: NoUi.BooleanEditor;

        // Gesetzt, wenn alle Sprachen aufgezeichnet werden sollen.
        allLanguages: boolean;

        // Gesetzt, wenn auch die AC3 Tonspur aufgezeichnet werden soll.
        includeDolby: boolean;

        // Gesetzt, wenn auch der Videotext aufgezeichnet werden soll.
        withVideotext: boolean;

        // Gesetzt, wenn auch DVB Untertitel aufgezeichnet werden sollen.
        withSubtitles: boolean;

        // Der Name der Quelle, die aufgezeichnet werden soll.
        sourceName: string;

        readonly channelSelector: NoUi.ChannelEditor;

        // Erstellt eine für die Datenübertragung geeignete Variante.
        toWebService(): VCRServer.EditJobContract {
            var contract: VCRServer.EditJobContract = {
                lockedToDevice: this.lockedToDevice,
                withVideotext: this.withVideotext,
                withSubtitles: this.withSubtitles,
                allLanguages: this.allLanguages,
                includeDolby: this.includeDolby,
                sourceName: this.sourceName,
                directory: this.directory,
                device: this.device,
                name: this.name
            };

            return contract;
        }

        // Prüft alle Daten.
        validate(sources: VCRServer.SourceEntry[]): void {
            // Aktualisieren.
            this.channelSelector.setSources(sources);

            // Lokalisierte Prüfungen.
            this.nameEditor.validate();
            this.deviceEditor.validate();
            this.folderEditor.validate();
            this.lockedEditor.validate();
            this.channelSelector.validate();
        }
    }

}