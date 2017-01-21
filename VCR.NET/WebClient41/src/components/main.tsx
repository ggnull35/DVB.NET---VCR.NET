﻿/// <reference path="../vcrnet.tsx" />

namespace VCRNETClient {
    interface IMainStatic {
    }

    export class Main extends React.Component<IMainStatic, INoDynamicState> implements App.IApplicationSite, App.NoUi.IHelpSite {
        private static _topics: { [section: string]: App.NoUi.IHelpComponent; };

        private static initStatic(): void {
            Main._topics = {
                ["repeatingschedules"]: new HelpPages.RepeatingSchedules(),
                ["parallelrecording"]: new HelpPages.ParallelRecording(),
                ["epgconfig"]: new HelpPages.AdminProgramGuide(),
                ["psiconfig"]: new HelpPages.AdminSourceScan(),
                ["overview"]: new HelpPages.Overview(),
                ["epg"]: new HelpPages.ProgramGuide(),
                ["archive"]: new HelpPages.Archive(),
                ["log"]: new HelpPages.Log()
            };
        }

        private _application = new App.Application(this);

        private _onhashchange: () => void;

        constructor() {
            super();

            if (!Main._topics)
                Main.initStatic();

            this._onhashchange = this.onhashchange.bind(this);
        }

        componentDidMount(): void {
            this._application.helpPage.setSite(this);

            window.addEventListener("hashchange", this._onhashchange);
        }

        componentWillUnmount(): void {
            window.removeEventListener("hashchange", this._onhashchange);

            this._application.helpPage.setSite(undefined);
        }

        refreshUi(): void {
            this.forceUpdate();
        }

        onFirstStart(): void {
            this.onhashchange();
        }

        render(): JSX.Element {
            var title = this._application.getTitle();
            var page = this._application.page;

            if (document.title !== title)
                document.title = title;

            if (this._application.getIsBusy())
                return <div className="vcrnet-main">
                    <h1>(Bitte etwas Geduld)</h1>
                </div>;
            else
                return <div className="vcrnet-main">
                    <h1>{page ? page.title : title}</h1>
                    <Navigation noui={page} />
                    <View noui={page} />
                </div>;
        }

        private onhashchange(): void {
            // Auslesen der Kennung - für FireFox ist es nicht möglich, .hash direkt zu verwenden, da hierbei eine Decodierung durchgeführt wird
            var query = window.location.href.split("#");
            var hash = (query.length > 1) ? query[1] : "";

            if (hash.length < 1)
                this.setPage();
            else {
                var sep = hash.indexOf(";");
                if (sep < 0)
                    this.setPage(hash);
                else
                    this.setPage(hash.substr(0, sep), hash.substr(sep + 1));
            }
        }

        private setPage(name: string = "", section: string = "") {
            this._application.switchPage(name, section);
        }

        goto(name: string): void {
            window.location.href = `#${name}`;
        }

        getCurrentHelpTitle(section: string): string {
            var topic = this.getHelpComponentProvider<HelpComponent>()[section];

            return topic && topic.getTitle();
        }

        getHelpComponentProvider<TComponentType extends App.NoUi.IHelpComponent>(): App.NoUi.IHelpComponentProvider<TComponentType> {
            return Main._topics as App.NoUi.IHelpComponentProvider<TComponentType>;
        }

    }
}
