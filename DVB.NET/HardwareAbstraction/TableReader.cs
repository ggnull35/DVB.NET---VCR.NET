﻿using System;
using System.Threading;
using System.Threading.Tasks;
using JMS.DVB.SI;


namespace JMS.DVB
{
    /// <summary>
    /// Schnittstelle zur Kontrolle des asynchronen Einlesens einer Tabelle, die auf mehrere 
    /// SI Bereichte verteilt sein kann.
    /// </summary>
    /// <remarks>
    /// Die Schnittstellenmethoden dürfen nur auf dem <see cref="Thread"/> verwendet werden,
    /// auf dem die zugehörige Objektinstanz erzeugt wurde. Also insbesondere <b>nicht</b>
    /// in einer Rückrufmethode zur Auswertung der Tabellen.
    /// </remarks>
    public interface IAsynchronousTableReader : IDisposable
    {
        /// <summary>
        /// Bricht den Zugriff ab.
        /// </summary>
        void Cancel();

        /// <summary>
        /// Meldet die Synchronisationsinstanz zu diesem asynchronen Aufruf.
        /// </summary>
        WaitHandle WaitHandle { get; }
    }

    /// <summary>
    /// Schnittstelle zur Kontrolle des asynchronen Einlesens einer Tabelle, die auf mehrere 
    /// SI Bereichte verteilt sein kann.
    /// </summary>
    /// <typeparam name="T">Die Art der SI Tabelle, auf die gewartet wird.</typeparam>
    /// <remarks>
    /// Die Schnittstellenmethoden dürfen nur auf dem <see cref="Thread"/> verwendet werden,
    /// auf dem die zugehörige Objektinstanz erzeugt wurde. Also insbesondere <b>nicht</b>
    /// in einer Rückrufmethode zur Auswertung der Tabellen.
    /// </remarks>
    public interface IAsynchronousTableReader<T> : IAsynchronousTableReader where T : Table
    {
        /// <summary>
        /// Wartet auf die angeforderten Tabellen.
        /// </summary>
        /// <param name="milliSeconds">Die Wartezeit in Millisekunden.</param>
        /// <returns>Die angeforderten Tabellen oder <i>null</i>, wenn diese noch nicht bereit stehen.</returns>
        T[] WaitForTables( int milliSeconds );
    }

    /// <summary>
    /// Hilfsklasse zum Einlesen einer einzelnen Tabelle, die auf mehrere SI Bereiche verteilt
    /// sein kann.
    /// </summary>
    public class TableReader<T> : IAsynchronousTableReader<T> where T : Table
    {
        /// <summary>
        /// Wird gesetzt, sobald ein Ergebnis bereit steht.
        /// </summary>
        private ManualResetEvent m_Done = new ManualResetEvent( false );

        /// <summary>
        /// Die Analyseeinheit für die Tabellen.
        /// </summary>
        private TableParser m_Parser;

        /// <summary>
        /// Gesetzt, wenn eine Auswertung der Tabellen aktiv ist.
        /// </summary>
        private volatile bool m_Active = false;

        /// <summary>
        /// Gesetzt, wenn eine Anmeldung an der Geräteabstraktion vorliegt.
        /// </summary>
        private bool m_IsRegistered = false;

        /// <summary>
        /// Die Datenstromkennung (PID) für die SI Tabelle.
        /// </summary>
        private ushort m_Stream;

        /// <summary>
        /// Die Geräteabstraktion, über die der Datenstrom empfangen wird.
        /// </summary>
        private Hardware m_Provider;

        /// <summary>
        /// Die Methode, die aufgerufen werden soll, sobald eine Tabelle vollständig ermittelt wurde.
        /// </summary>
        private Action<T[]> m_Consumer;

        /// <summary>
        /// Die bisher rekonstruierten Tabellenteile.
        /// </summary>
        private volatile T[] m_Tables = null;

        /// <summary>
        /// Die Versionsnummer für die Rekonstruktion der Tabellenteile.
        /// </summary>
        private int m_Version = 0;

        /// <summary>
        /// Bisher gefundene Tabellenfragmente.
        /// </summary>
        private int m_TableCount = 0;

        /// <summary>
        /// Die eindeutige Kennung des zugehörigen Verbrauchers.
        /// </summary>
        private Guid m_ConsumerId;

        /// <summary>
        /// Erzeugt eine neue Instanz.
        /// </summary>
        /// <param name="provider">Die zu aktuelle Hardware Abstraktion.</param>
        /// <param name="stream">Die eindeutige Nummer (PID) des Datenstroms in der aktuellen <see cref="SourceGroup"/>.</param>
        /// <param name="consumer">Eine Methode, die bei vollständiger Rekonstruktion der Tabelle aufgerufen werden soll.</param>
        public TableReader( Hardware provider, ushort stream, Action<T[]> consumer )
        {
            // Remember
            m_Provider = provider;
            m_Consumer = consumer;
            m_Stream = stream;

            // Configure parser
            m_Parser = TableParser.Create<T>( OnTable );

            // Activate
            Restart();
        }

        /// <summary>
        /// Beschickt die Analyseeinheit mit Daten.
        /// </summary>
        /// <param name="data">Ein Datenblock, der ausgewertet werden soll.</param>
        /// <param name="offset">Das erste zu benutzende Byte.</param>
        /// <param name="length">Die Anzahl der zu benutzenden Bytes.</param>
        public void ProcessData( byte[] data, int offset, int length )
        {
            // Forward
            m_Parser.AddPayload( data, offset, length );
        }

        /// <summary>
        /// Beginnt die Annahme von SI Tabellen erneut.
        /// </summary>
        private void Restart()
        {
            // Stop first
            Cancel();

            // Start receiving
            m_TableCount = 0;
            m_Tables = null;
            m_Done.Reset();
            m_Version = 0;

            // Connected to hardware
            if (null != m_Provider)
            {
                // Register
                m_ConsumerId = m_Provider.AddConsumer( m_Stream, m_Parser, Table.GetIsExtendedTable<T>() ? StreamTypes.ExtendedTable : StreamTypes.StandardTable );

                // Start receiving data immediately
                m_Provider.SetConsumerState( m_ConsumerId, true );
            }

            // Enable parsing
            m_IsRegistered = true;
            m_Active = true;
        }

        /// <summary>
        /// Nimmt eine Tabelle entgegen.
        /// </summary>
        /// <param name="table">Eine Tabelle, eventuell nur ein Teil einer auf mehrere SI
        /// Bereiche verteilte Gesamttabelle.</param>
        private void OnTable( T table )
        {
            // Disabled
            if (!m_Active)
                return;

            // Check version
            if (null != m_Tables)
                if (table.Version != m_Version)
                    m_Tables = null;

            // Discard on count mismatch
            if (null != m_Tables)
                if (m_Tables.Length != (table.LastSection + 1))
                    m_Tables = null;

            // Discard on overrun
            if (null != m_Tables)
                if (table.CurrentSection >= m_Tables.Length)
                    m_Tables = null;

            // Discard on duplicates
            if (null != m_Tables)
                if (null != m_Tables[table.CurrentSection])
                    m_Tables = null;

            // Create once
            if (null == m_Tables)
            {
                // Create in full size
                m_Tables = new T[table.LastSection + 1];
                m_Version = table.Version;
                m_TableCount = 0;
            }

            // Add it
            m_Tables[table.CurrentSection] = table;

            // Count it
            if (++m_TableCount < m_Tables.Length)
                return;

            // Lock out further actions
            m_Active = false;

            // Load the result
            T[] tables = m_Tables;

            // Notify synchronous clients
            if (null != m_Consumer)
                if (null != tables)
                    m_Consumer( tables );

            // Synchronize contents
            Thread.MemoryBarrier();

            // Notify asynchronous clients
            m_Done.Set();
        }

        #region ITableReader<T> Members

        /// <summary>
        /// Bricht den Zugriff ab.
        /// </summary>
        public void Cancel()
        {
            // Disable analysis
            m_Active = false;

            // Already done
            if (m_IsRegistered)
                try
                {
                    // Stop receiving this SI stream
                    if (null != m_Provider)
                        m_Provider.SetConsumerState( m_ConsumerId, null );
                }
                finally
                {
                    // Deleted registration
                    m_IsRegistered = false;
                }
        }

        /// <summary>
        /// Beendet die Nutzung dieser Instanz endgültig.
        /// </summary>
        public void Dispose()
        {
            // Forward
            Cancel();
        }

        /// <summary>
        /// Wartet auf die angeforderten Tabellen.
        /// </summary>
        /// <param name="milliSeconds">Die Wartezeit in Millisekunden.</param>
        /// <returns>Die angeforderten Tabellen oder <i>null</i>, wenn diese noch nicht bereit stehen.</returns>
        public T[] WaitForTables( int milliSeconds )
        {
            // Forward
            if (!m_Done.WaitOne( milliSeconds, false ))
                return null;

            // Stop receiver
            Cancel();

            // Report
            return m_Tables;
        }

        /// <summary>
        /// Meldet die Synchronisationsinstanz zu diesem asynchronen Aufruf.
        /// </summary>
        public WaitHandle WaitHandle { get { return m_Done; } }

        #endregion
    }

    /// <summary>
    /// Hilfsklasse zum Einlesen einer einzelnen Tabelle, die auf mehrere SI Bereiche verteilt
    /// sein kann.
    /// </summary>
    /// <typeparam name="TTableType">Die Art der angeforderten Tabelle.</typeparam>
    public sealed class AsyncTableReader<TTableType> : Task<TTableType[]> where TTableType : Table
    {
        /// <summary>
        /// Ein leeres Feld von Tabellen.
        /// </summary>
        private static readonly TTableType[] _NoTables = { };

        /// <summary>
        /// Die bisher rekonstruierten Tabellenteile.
        /// </summary>
        private volatile TTableType[] m_tables;

        /// <summary>
        /// Die Versionsnummer für die Rekonstruktion der Tabellenteile.
        /// </summary>
        private int m_expectedVersion;

        /// <summary>
        /// Bisher gefundene Tabellenfragmente.
        /// </summary>
        private int m_collectedParts;

        /// <summary>
        /// Synchronisiert den Lesevorgang.
        /// </summary>
        private readonly object m_sync = new object();

        /// <summary>
        /// Gesetzt, wenn der Lesevorgang abgeschlossen ist.
        /// </summary>
        private volatile bool m_done;

        /// <summary>
        /// Steuert das vorzeitige Beenden.
        /// </summary>
        private volatile CancellationTokenSource m_cancel;

        /// <summary>
        /// Erzeugt eine neue Instanz.
        /// </summary>
        /// <param name="taskMethod">Die Methode, die zur Ausführung der Aufgabe aufgerufen werden soll.</param>
        private AsyncTableReader( Func<TTableType[]> taskMethod )
            : base( taskMethod )
        {
            // Finish
            m_cancel = new CancellationTokenSource();
        }

        /// <summary>
        /// Bricht den Wartevorgang ab.
        /// </summary>
        public void Cancel()
        {
            var cancel = m_cancel;
            if (cancel != null)
                try
                {
                    cancel.Cancel();
                }
                catch (ObjectDisposedException)
                {
                }
        }

        /// <summary>
        /// Bricht den Wartevorgang nach einer bestimmten Zeit automatisch ab.
        /// </summary>
        /// <param name="timeout">Die gewünschte Zeit in Millisekunden.</param>
        public void CancelAfter( int timeout )
        {
            var cancel = m_cancel;
            if (cancel != null)
                try
                {
                    cancel.CancelAfter( timeout );
                }
                catch (ObjectDisposedException)
                {
                }
        }

        /// <summary>
        /// Erzeugt eine neue Hintergrundaufgabe zum Auslesen von SI Tabellen.
        /// </summary>
        /// <param name="device">Das zu verwendende Gerät.</param>
        /// <param name="stream">Die Datenstromkennung, die überwacht werden soll.</param>
        /// <returns>Die neue Aufgabe.</returns>
        public static AsyncTableReader<TTableType> Create( Hardware device, ushort stream )
        {
            // Allow self reference to new instance
            AsyncTableReader<TTableType> reader = null;

            // Create instance
            reader =
                new AsyncTableReader<TTableType>( () =>
                {
                    using (var controller = reader.m_cancel)
                        try
                        {
                            // Prepare
                            var tableType = Table.GetIsExtendedTable<TTableType>() ? StreamTypes.ExtendedTable : StreamTypes.StandardTable;
                            var parser = TableParser.Create<TTableType>( reader.ProcessTable );
                            var cancel = controller.Token;

                            // Register with cleanup
                            var registration = device.AddConsumer( stream, parser, tableType );
                            try
                            {
                                // Start receiving data
                                device.SetConsumerState( registration, true );

                                // Wait for either cancel or proper termination
                                using (cancel.Register( reader.Wakeup ))
                                    lock (reader.m_sync)
                                        while (!reader.m_done)
                                            if (cancel.IsCancellationRequested)
                                                return _NoTables;
                                            else
                                                Monitor.Wait( reader.m_sync );

                                // Report
                                return reader.m_tables ?? _NoTables;
                            }
                            finally
                            {
                                // Reset
                                device.SetConsumerState( registration, null );
                            }
                        }
                        catch (Exception)
                        {
                            // None
                            return _NoTables;
                        }
                        finally
                        {
                            // Disallow cancel
                            reader.m_cancel = null;
                        }
                } );

            // Start it
            try
            {
                // Request start
                reader.Start();

                // Report
                return reader;
            }
            catch (Exception)
            {
                // With cleanup
                using (reader.m_cancel)
                    throw;
            }
        }

        /// <summary>
        /// Nimmt eine Tabelle entgegen.
        /// </summary>
        /// <param name="table">Eine Tabelle, eventuell nur ein Teil einer auf mehrere SI
        /// Bereiche verteilte Gesamttabelle.</param>
        private void ProcessTable( TTableType table )
        {
            // Disabled
            if (m_done)
                return;

            // Check version
            if (m_tables != null)
                if (table.Version != m_expectedVersion)
                    m_tables = null;

            // Discard on count mismatch
            if (m_tables != null)
                if (m_tables.Length != (table.LastSection + 1))
                    m_tables = null;

            // Discard on overrun
            if (m_tables != null)
                if (table.CurrentSection >= m_tables.Length)
                    m_tables = null;

            // Discard on duplicates
            if (m_tables != null)
                if (m_tables[table.CurrentSection] != null)
                    m_tables = null;

            // Create once
            if (m_tables == null)
            {
                // Create in full size
                m_tables = new TTableType[table.LastSection + 1];
                m_expectedVersion = table.Version;
                m_collectedParts = 0;
            }

            // Add it
            m_tables[table.CurrentSection] = table;

            // Count it
            if (++m_collectedParts < m_tables.Length)
                return;

            // Mark as done
            m_done = true;

            // Notify asynchronous client
            Wakeup();
        }

        /// <summary>
        /// Signalisiert einen neuen Zustand.
        /// </summary>
        private void Wakeup()
        {
            lock (m_sync)
                Monitor.PulseAll( m_sync );
        }
    }
}
