INSERT INTO CATEGORIE_PRODOTTO (nomeCategoria, attiva) VALUES
('Cosmetici', TRUE),
('Pulizia', TRUE),
('Industriale', TRUE),
('Alimentare', TRUE),
('Chimica', TRUE);

INSERT INTO MATERIALI_BASE (nomeMateriale, costoUnitarioMedio, scortaMinima, fornitoriDisponibili) VALUES
('Acqua demineralizzata', 0.50, 100, 3),
('Glicerina', 1.20, 50, 2),
('Alcol etilico', 0.80, 70, 4),
('Fragranza', 2.50, 30, 2),
('Colorante rosso', 1.00, 20, 1);

INSERT INTO MISCELE (nomeMiscela, statoMiscela, tempoMiscelazione) VALUES
('Miscela A', 'PRONTO', 15),
('Miscela B', 'NON PRONTO', 20),
('Miscela C', 'PRONTO', 10),
('Miscela D', 'NON PRONTO', 25),
('Miscela E', 'PRONTO', 30);

INSERT INTO COMPONE (idMiscela, idMaterialeBase) VALUES
(1, 1),
(1, 2),
(2, 2),
(2, 3),
(3, 1),
(3, 4),
(4, 3),
(4, 5),
(5, 1),
(5, 5);

INSERT INTO FORNITORI (ragioneSociale, partitaIVA, indirizzo, citta, provincia, CAP, email, telefonoReferente, nomeReferente) VALUES
('Forniture Chimiche SRL', '12345678901', 'Via Roma 1', 'Milano', 'MI', '20100', 'info@fornchim.it', '0245678901', 'Luca Rossi'),
('Distribuzioni Cosmetiche SPA', '23456789012', 'Via Torino 12', 'Torino', 'TO', '10100', 'contact@discos.it', '0112345678', 'Anna Bianchi'),
('Alcolici e Derivati', '34567890123', 'Via Napoli 5', 'Napoli', 'NA', '80100', 'sales@ald.it', '0815678901', 'Mario Verdi'),
('Fragranze Europee', '45678901234', 'Via Firenze 7', 'Firenze', 'FI', '50100', 'info@frag.eu', '0551234567', 'Elena Neri'),
('Coloranti Globali', '56789012345', 'Via Bologna 9', 'Bologna', 'BO', '40100', 'support@colorglo.it', '0519876543', 'Paolo Gialli');

INSERT INTO CATALOGO_FORNITORI (codiceFornitore, tempoConsegna, valuta, prezzoUnitario, preferito, idFornitoreCatalogo, idMaterialeBaseCatologo) VALUES
('CH-001', '2026-02-15 09:00:00', 'EURO', 0.52, TRUE, 1, 1),
('GC-002', '2026-02-16 10:00:00', 'EURO', 1.22, FALSE, 2, 2),
('AL-003', '2026-02-17 11:00:00', 'EURO', 0.85, TRUE, 3, 3),
('FR-004', '2026-02-18 12:00:00', 'EURO', 2.55, TRUE, 4, 4),
('CO-005', '2026-02-19 13:00:00', 'EURO', 1.05, FALSE, 5, 5);

INSERT INTO ORDINI_ACQUISTO (numeroOrdine, dataOrdine, dataConsegnaPrevista, dataConsegnaEffettiva, statoOrdine, totaleOrdine, idFornitoreOrdini) VALUES
('OA-1001', '2026-02-10', '2026-02-20', NULL, 'IN CORSO', 500.00, 1),
('OA-1002', '2026-02-11', '2026-02-21', NULL, 'IN CORSO', 300.00, 2),
('OA-1003', '2026-02-12', '2026-02-22', NULL, 'IN CORSO', 450.00, 3),
('OA-1004', '2026-02-13', '2026-02-23', NULL, 'IN CORSO', 600.00, 4),
('OA-1005', '2026-02-14', '2026-02-24', NULL, 'IN CORSO', 250.00, 5);

INSERT INTO RIGHE_ORDINE (idRigaOrdine, quantita, prezzoUnitario, sconto, idOrdineAcquisto, idMaterialeBase) VALUES
(1, 100, 0.52, 0, 1, 1),
(2, 50, 1.22, 5, 2, 2),
(3, 200, 0.85, 0, 3, 3),
(4, 75, 2.55, 10, 4, 4),
(5, 30, 1.05, 0, 5, 5);

INSERT INTO REPARTI (attivo, nomeReparto, VLAN) VALUES
(TRUE, 'Produzione Chimica', 10),
(TRUE, 'Controllo Qualità', 20),
(TRUE, 'Logistica', 30),
(TRUE, 'Magazzino', 40),
(TRUE, 'Amministrazione', 50);

INSERT INTO MAGAZZINI (attivo, nomeMagazzino, tipoMagazzino) VALUES
(TRUE, 'Magazzino Principale', 'Materie Prime'),
(TRUE, 'Magazzino Secondario', 'Prodotti Finiti'),
(TRUE, 'Magazzino Chimici', 'Materie Prime'),
(TRUE, 'Magazzino Cosmetici', 'Prodotti Finiti'),
(TRUE, 'Magazzino Industriale', 'Materie Prime');

INSERT INTO VLAN_AUTORIZZATE (numeroVLAN, dataEntrata) VALUES
(10, '2026-01-01 08:00:00'),
(20, '2026-01-01 08:00:00'),
(30, '2026-01-01 08:00:00'),
(40, '2026-01-01 08:00:00'),
(50, '2026-01-01 08:00:00');

INSERT INTO LINEE_PRODUZIONE (statoLinea, numeroLinea) VALUES
('ATTIVO', 1),
('ATTIVO', 2),
('ATTIVO', 3),
('ATTIVO', 4),
('ATTIVO', 5);

INSERT INTO UTENTI_SISTEMI (ruoloSistema, username, password, idVLAN) VALUES
('ADMIN', 'admin1', 'pass123', 1),
('USER', 'user1', 'pass123', 2),
('USER', 'user2', 'pass123', 3),
('USER', 'user3', 'pass123', 4),
('USER', 'user4', 'pass123', 5);

INSERT INTO DIPENDENTI (dataAssunzione, dataNascita, fiscale, cognome, nome, ruolo, stato, email, telefono, idReparto, idMagazzino, idLinea, idUtente) VALUES
('2022-01-15', '1990-05-12', 'RSSMRA90A01H501U', 'Rossi', 'Mario', 'IMPIEGATO', 'RIPOSO', 'm.rossi@azienda.it', '3456789012', 1, 1, 1, 1),
('2021-06-10', '1985-11-20', 'BNCLGU85B20F839T', 'Bianchi', 'Lucia', 'IMPIEGATO', 'RIPOSO', 'l.bianchi@azienda.it', '3456789013', 2, 2, 2, 2),
('2023-03-01', '1992-07-08', 'VRDMRA92C08L219Z', 'Verdi', 'Marco', 'IMPIEGATO', 'RIPOSO', 'm.verdi@azienda.it', '3456789014', 3, 3, 3, 3),
('2020-12-05', '1988-02-25', 'NRSCLD88B25H501K', 'Neri', 'Elena', 'IMPIEGATO', 'RIPOSO', 'e.neri@azienda.it', '3456789015', 4, 4, 4, 4),
('2019-09-17', '1995-09-14', 'GLLPRA95P14F205M', 'Gialli', 'Paolo', 'IMPIEGATO', 'RIPOSO', 'p.gialli@azienda.it', '3456789016', 5, 5, 5, 5);

INSERT INTO LOTTI_PRODUZIONI (statoLotto, esitoLotto, idLineaLotto) VALUES
('ATTIVO', TRUE, 1),
('ATTIVO', FALSE, 2),
('ATTIVO', TRUE, 3),
('ATTIVO', TRUE, 4),
('ATTIVO', FALSE, 5);

INSERT INTO MACCHINARI (protocolloComunicazione, portaComunicazione, nomeMacchina, modello, VLAN, idLineaMacchina) VALUES
('TCP', 502, 'Miscelatore A', 'MX-100', 10, 1),
('TCP', 503, 'Miscelatore B', 'MX-200', 20, 2),
('UDP', 504, 'Linea Imballaggio 1', 'LB-100', 30, 3),
('TCP', 505, 'Linea Etichettatura', 'LE-200', 40, 4),
('UDP', 506, 'Macchina Taglio', 'MT-50', 50, 5);

INSERT INTO DISPOSITIVI_RETE (statoDispositivo, codiceDispositivo, tipoDispositivo, numeroPorte, numeroVLAN, produttore, idMacchinaRete) VALUES
('ATTIVO', 'SW-01', 'Switch', 24, 5, 'Cisco', 1),
('ATTIVO', 'SW-02', 'Switch', 48, 5, 'Cisco', 2),
('ATTIVO', 'RT-01', 'Router', 4, 5, 'TP-Link', 3),
('ATTIVO', 'SW-03', 'Switch', 24, 5, 'Netgear', 4),
('ATTIVO', 'FW-01', 'Firewall', 8, 5, 'Fortinet', 5);

INSERT INTO SENSORI_IT (attivo, frequenzaLettura, unitaDiMisura, tipoSensore, indirizzoIP, idMacchinaSensori, idDispositivoSensori) VALUES
(TRUE, 1.5, '°C', 'Temperatura', '192.168.10.101', 1, 1),
(TRUE, 2.0, 'Bar', 'Pressione', '192.168.10.102', 2, 2),
(TRUE, 0.5, 'RPM', 'Velocità', '192.168.10.103', 3, 3),
(TRUE, 1.0, '%', 'Umidità', '192.168.10.104', 4, 4),
(TRUE, 5.0, 'L/min', 'Flusso', '192.168.10.105', 5, 5);

INSERT INTO LETTURE_SENSORI (timeStampLettura, anomalia, valore, idSensore) VALUES
('2026-02-11 08:00:00', FALSE, 25.0, 1),
('2026-02-11 08:05:00', FALSE, 1.2, 2),
('2026-02-11 08:10:00', FALSE, 1500, 3),
('2026-02-11 08:15:00', TRUE, 80, 4),
('2026-02-11 08:20:00', FALSE, 30, 5);

INSERT INTO CLIENTI (telefono, email, cognome, nome, partitaIVA, CAP) VALUES
('3331234567', 'cliente1@email.com', 'Rossi', 'Luca', '12345678901', '20100'),
('3342345678', 'cliente2@email.com', 'Bianchi', 'Anna', '23456789012', '10100'),
('3353456789', 'cliente3@email.com', 'Verdi', 'Marco', '34567890123', '80100'),
('3364567890', 'cliente4@email.com', 'Neri', 'Elena', '45678901234', '50100'),
('3375678901', 'cliente5@email.com', 'Gialli', 'Paolo', '56789012345', '40100');

INSERT INTO PRODOTTI (idCategoriaProdotto, idMiscelaProdotto, idLottoProdotto) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(4, 4, 4),
(5, 5, 5);

INSERT INTO ORDINE_VENDITA (totaleOrdine, dataOrdine, idCliente) VALUES
(150, '2026-02-10 09:00:00', 1),
(200, '2026-02-11 10:00:00', 2),
(300, '2026-02-12 11:00:00', 3),
(400, '2026-02-13 12:00:00', 4),
(250, '2026-02-14 13:00:00', 5);

INSERT INTO RIGHE_ORDINE_VENDITA (prezzoUnitario, quantita, numeroOrdine, idProdottoRighe) VALUES
(30, 5, 1, 1),
(40, 5, 2, 2),
(60, 5, 3, 3),
(80, 5, 4, 4),
(50, 5, 5, 5);

INSERT INTO FATTURE_VENDITA (dataScadenzaPagamento, dataEmissione, totaleFattura, numeroOrdine) VALUES
('2026-03-10 00:00:00', '2026-02-10 09:00:00', 150, 1),
('2026-03-11 00:00:00', '2026-02-11 10:00:00', 200, 2),
('2026-03-12 00:00:00', '2026-02-12 11:00:00', 300, 3),
('2026-03-13 00:00:00', '2026-02-13 12:00:00', 400, 4),
('2026-03-14 00:00:00', '2026-02-14 13:00:00', 250, 5);

INSERT INTO PAGAMENTI (riferimentoTransazione, importPagamento, dataPagamento, metodoPagamento, numeroFattura) VALUES
('TRX-1001', 150, '2026-02-15', 'Carta', 1),
('TRX-1002', 200, '2026-02-16', 'Bonifico', 2),
('TRX-1003', 300, '2026-02-17', 'Carta', 3),
('TRX-1004', 400, '2026-02-18', 'Bonifico', 4),
('TRX-1005', 250, '2026-02-19', 'Carta', 5);