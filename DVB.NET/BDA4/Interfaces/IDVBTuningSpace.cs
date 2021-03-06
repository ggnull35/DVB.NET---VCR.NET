using System;
using System.Runtime.InteropServices;


namespace JMS.DVB.DeviceAccess.Interfaces
{
    /// <summary>
    /// Beschreibt einen Namensraum f�r den digitalen Empfang.
    /// </summary>
    [
        ComImport,
        Guid( "ada0b268-3b19-4e5b-acc4-49f852be13ba" ),
        InterfaceType( ComInterfaceType.InterfaceIsIDispatch )
    ]
    public interface IDVBTuningSpace // : ITuningSpace
    {
        #region ITuningSpace

        /// <summary>
        /// Der eindeutige Name.
        /// </summary>
        string UniqueName { [return: MarshalAs( UnmanagedType.BStr )] get; [param: MarshalAs( UnmanagedType.BStr )] set; }

        /// <summary>
        /// Der Anzeigename.
        /// </summary>
        string FriendlyName { [return: MarshalAs( UnmanagedType.BStr )] get; [param: In, MarshalAs( UnmanagedType.BStr )] set; }

        /// <summary>
        /// Die eindeutige Kennung.
        /// </summary>
        string CLSID { [return: MarshalAs( UnmanagedType.BStr )] get; }

        /// <summary>
        /// Die Art des Netzwerks.
        /// </summary>
        string NetworkType { [return: MarshalAs( UnmanagedType.BStr )] get; [param: In, MarshalAs( UnmanagedType.BStr )] set; }

        /// <summary>
        /// Die Art des Netzwerks als eindeutige Kennung.
        /// </summary>
        Guid _NetworkType { get; set; }

        /// <summary>
        /// Erzeugt eine neue Quellgruppenwechselanfrage.
        /// </summary>
        /// <returns>Die gew�nschte Beschreibung der Quellgruppe.</returns>
        [return: MarshalAs( UnmanagedType.Interface )]
        ITuneRequest CreateTuneRequest();

        /// <summary>
        /// Meldet eine Auflistung �ber alle Kategorien.
        /// </summary>
        /// <returns>Die gew�nschte Auflistung.</returns>
        [return: MarshalAs( UnmanagedType.Interface )]
        IEnumGUID EnumCategoryGUIDs();

        /// <summary>
        /// Meldet eine Auflistung �ber alle Ger�te.
        /// </summary>
        /// <returns>Die gew�nschte Auflistung.</returns>
        [return: MarshalAs( UnmanagedType.Interface )]
        IEnumMoniker EnumDeviceMonikers();

        /// <summary>
        /// Meldet die bevorzugten Komponentenarten.
        /// </summary>
        IComponentTypes DefaultPreferredComponentTypes { get; set; }

        /// <summary>
        /// Die Frequenzabbildung.
        /// </summary>
        string FrequencyMapping { [return: MarshalAs( UnmanagedType.BStr )] get; [param: MarshalAs( UnmanagedType.BStr )] set; }

        /// <summary>
        /// Die Standardinformationen zum Wechsel einer Quellgruppe.
        /// </summary>
        ILocator DefaultLocator { get; set; }

        /// <summary>
        /// Erzeugt eine exakte Kopie dieses Namensraums.
        /// </summary>
        /// <returns></returns>
        [return: MarshalAs( UnmanagedType.Interface )]
        ITuningSpace Clone();

        #endregion

        /// <summary>
        /// Die Art des Empfangs.
        /// </summary>
        DVBSystemType SystemType { get; set; }
    }
}
