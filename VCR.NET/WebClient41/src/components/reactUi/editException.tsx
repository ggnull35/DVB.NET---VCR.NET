﻿/// <reference path="../../vcrnet.tsx" />

namespace VCRNETClient.Ui {

    // Schnittstelle zur Pflege einer Ausnahmeregel.
    interface IEditExceptionStatic extends INoUiComponent<App.NoUi.IPlanException> {
        // Die aktuell angezeigte Seite.
        page: App.NoUi.IPage;
    }

    // React.Js Komponente zur Pflege einer einzelnen Ausnahmeregel.
    export class EditException extends NoUiViewExWithSite<App.NoUi.IPlanException, IEditExceptionStatic> {
        // Erstellt die Oberflächenelemente zur Pflege.
        render(): JSX.Element {
            return <fieldset className="vcrnet-editexception">
                <legend>Ausnahmeregel bearbeiten<HelpLink page={this.props.page} topic="repeatingschedules" /></legend>
                <table>
                    <tbody>
                        <tr>
                            <td>Start</td>
                            <td>{this.props.noui.getStart()}</td>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td>Ende</td>
                            <td>{this.props.noui.getEnd()}</td>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td>Dauer</td>
                            <td>{`${this.props.noui.getDuration()} Minute${(this.props.noui.getDuration() === 1) ? '' : 'n'}`}</td>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td>Startverschiebung</td>
                            <td>{`${this.props.noui.startShift} Minute${(Math.abs(this.props.noui.startShift) === 1) ? '' : 'n'}`}</td>
                            <td><EditNumberWithSlider noui={this.props.noui.startSlider} /></td>
                        </tr>
                        <tr>
                            <td>Laufzeitanpassung</td>
                            <td>{`${this.props.noui.timeDelta} Minute${(Math.abs(this.props.noui.timeDelta) === 1) ? '' : 'n'}`}</td>
                            <td><EditNumberWithSlider noui={this.props.noui.durationSlider} /></td>
                        </tr>
                    </tbody>
                </table>
                <div>
                    <button onClick={() => this.props.noui.reset()}>Ursprüngliche Planung</button>
                    <button onClick={() => this.props.noui.disable()}>Nicht aufzeichnen</button>
                    <button onClick={() => this.props.noui.update()}>Einstellungen übernehmen</button>
                </div>
            </fieldset>;
        }
    }
}