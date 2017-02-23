﻿/// <reference path="section.ts" />
/// <reference path="../../../lib/edit/list.ts" />

namespace VCRNETClient.App.Admin {

    export enum HibernationMode {
        disabled,

        standBy,

        hibernate
    }

    export interface IAdminOtherPage extends ISection {
        readonly port: JMSLib.App.INumber;

        readonly ssl: JMSLib.App.IFlag;

        readonly securePort: JMSLib.App.INumber;

        readonly basicAuth: JMSLib.App.IFlag;

        readonly preSleep: JMSLib.App.INumber;

        readonly minSleep: JMSLib.App.INumber;

        readonly ignoreMinSleep: JMSLib.App.IFlag;

        readonly logKeep: JMSLib.App.INumber;

        readonly jobKeep: JMSLib.App.INumber;

        readonly noH264PCR: JMSLib.App.IFlag;

        readonly noMPEG2PCR: JMSLib.App.IFlag;

        readonly hibernation: JMSLib.App.IValueFromList<HibernationMode>;

        readonly logging: JMSLib.App.IValueFromList<string>;
    }

    export class OtherSection extends Section implements IAdminOtherPage {

        private static readonly _logging = [
            JMSLib.App.uiValue("Errors", "Nur Fehler"),
            JMSLib.App.uiValue("Security", "Nur Sicherheitsprobleme"),
            JMSLib.App.uiValue("Schedules", "Aufzeichnungen"),
            JMSLib.App.uiValue("Full", "Vollständig"),
        ];

        private static readonly _hibernation = [
            JMSLib.App.uiValue(HibernationMode.disabled, "Nicht verwenden"),
            JMSLib.App.uiValue(HibernationMode.standBy, "StandBy / Suspend (S3)"),
            JMSLib.App.uiValue(HibernationMode.hibernate, "Hibernate (S4)"),
        ];

        readonly port = new JMSLib.App.Number({}, "webPort", "TCP/IP Port für den Web Server", () => this.refreshUi(), true, 1, 0xffff);

        readonly ssl = new JMSLib.App.Flag({}, "ssl", "Sichere Verbindung zusätzlich anbieten", null);

        readonly securePort = new JMSLib.App.Number({}, "sslPort", "TCP/IP Port für den sicheren Zugang", () => this.refreshUi(), true, 1, 0xffff);

        readonly basicAuth = new JMSLib.App.Flag({}, "basicAuth", "Benutzererkennung über Basic (RFC 2617) zusätzlich erlauben (nicht empfohlen)", null);

        readonly preSleep = new JMSLib.App.Number({}, "hibernationDelay", "Vorlaufzeit für das Aufwachen aus dem Schlafzustand in Sekunden", () => this.refreshUi(), true, 0, 600);

        readonly minSleep = new JMSLib.App.Number({}, "forcedHibernationDelay", "Minimale Pause nach einem erzwungenen Schlafzustand in Minuten", () => this.refreshUi(), true, 5, 60);

        readonly ignoreMinSleep = new JMSLib.App.Flag({}, "suppressHibernationDelay", "Pause für erzwungenen Schlafzustand ignorieren", null);

        readonly logKeep = new JMSLib.App.Number({}, "protocol", "Aufbewahrungsdauer für Protokolle in Wochen", () => this.refreshUi(), true, 1, 13);

        readonly jobKeep = new JMSLib.App.Number({}, "archive", "Aufbewahrungsdauer von archivierten Aufzeichnungen in Wochen", () => this.refreshUi(), true, 1, 13);

        readonly noH264PCR = new JMSLib.App.Flag({}, "noH264PCR", "Systemzeit (PCR) in Aufzeichnungsdateien nicht aus einem H.264 Bildsignal ableiten", null);

        readonly noMPEG2PCR = new JMSLib.App.Flag({}, "noMPEG2PCR", "Systemzeit (PCR) in Aufzeichnungsdateien nicht aus einem MPEG2 Bildsignal ableiten", null);

        readonly hibernation = new JMSLib.App.SelectSingleFromList<HibernationMode>({ value: null }, "value", "Art des von VCR.NET ausgelösten Schlafzustands", null, false, OtherSection._hibernation);

        readonly logging = new JMSLib.App.SelectSingleFromList<string>({}, "logging", "Umfang der Protokollierung in das Windows Ereignisprotokoll", null, false, OtherSection._logging);

        protected loadAsync(): void {
            VCRServer.getOtherSettings().then(settings => this.initialize(settings));
        }

        private initialize(settings: VCRServer.OtherSettingsContract): void {
            this.ignoreMinSleep.data = settings;
            this.noMPEG2PCR.data = settings;
            this.securePort.data = settings;
            this.basicAuth.data = settings;
            this.noH264PCR.data = settings;
            this.minSleep.data = settings;
            this.preSleep.data = settings;
            this.jobKeep.data = settings;
            this.logKeep.data = settings;
            this.logging.data = settings;
            this.port.data = settings;
            this.ssl.data = settings;

            if (settings.mayHibernate)
                if (settings.useStandBy)
                    this.hibernation.value = HibernationMode.standBy;
                else
                    this.hibernation.value = HibernationMode.hibernate;
            else
                this.hibernation.value = HibernationMode.disabled;

            this.page.application.isBusy = false;
        }

        protected readonly saveCaption = "Ändern und eventuell neu Starten";

        protected get isValid(): boolean {
            if (this.port.message !== ``)
                return false;
            if (this.securePort.message !== ``)
                return false;
            if (this.hibernation.message !== ``)
                return false;
            if (this.preSleep.message !== ``)
                return false;
            if (this.minSleep.message !== ``)
                return false;
            if (this.logKeep.message !== ``)
                return false;
            if (this.jobKeep.message !== ``)
                return false;
            if (this.logging.message !== ``)
                return false;

            return true;
        }

        protected saveAsync(): JMSLib.App.IHttpPromise<boolean> {
            var settings: VCRServer.OtherSettingsContract = this.port.data;

            settings.mayHibernate = (this.hibernation.value !== HibernationMode.disabled);
            settings.useStandBy = (this.hibernation.value === HibernationMode.standBy);

            return VCRServer.setOtherSettings(settings);
        }
    }
}