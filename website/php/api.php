<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';
session_name('membrane_session');
session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
if ($action === '') {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $body['action'] ?? '';
}

$public_actions = ['login', 'check_session'];

if (!in_array($action, $public_actions, true) && empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Non autenticato']);
    exit;
}

const USERS = [
    'admin'    => ['pass' => 'admin123', 'role' => 'admin',   'name' => 'Mario Rossi',  'initials' => 'MR'],
    'operaio1' => ['pass' => 'pass123',  'role' => 'operaio', 'name' => 'Sara Conti',   'initials' => 'SC'],
];

try {
    switch ($action) {

        case 'login': {
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            $u = trim($body['username'] ?? '');
            $p = $body['password'] ?? '';

            if (!isset(USERS[$u]) || USERS[$u]['pass'] !== $p) {
                http_response_code(401);
                echo json_encode(['ok' => false, 'error' => 'Credenziali non valide']);
                exit;
            }

            session_regenerate_id(true);
            $_SESSION['user'] = [
                'username' => $u,
                'role'     => USERS[$u]['role'],
                'name'     => USERS[$u]['name'],
                'initials' => USERS[$u]['initials'],
            ];

            echo json_encode(['ok' => true, 'user' => $_SESSION['user']]);
            break;
        }

        case 'logout': {
            $_SESSION = [];
            session_destroy();
            echo json_encode(['ok' => true]);
            break;
        }

        case 'check_session': {
            if (!empty($_SESSION['user'])) {
                echo json_encode(['ok' => true, 'user' => $_SESSION['user']]);
            } else {
                echo json_encode(['ok' => false]);
            }
            break;
        }

        case 'initial_data': {
            $db = getDB();

            $ordiniAcquisto = $db->query("
                SELECT idOrdineAcquisto AS id, numeroOrdine AS numero,
                       DATE_FORMAT(dataOrdine,'%d/%m/%Y') AS data,
                       (SELECT ragioneSociale FROM FORNITORI WHERE idFornitore = idFornitoreOrdini) AS fornitore,
                       DATE_FORMAT(dataConsegnaPrevista,'%d/%m/%Y') AS consegna,
                       totaleOrdine AS totale, statoOrdine AS stato
                FROM ORDINI_ACQUISTO
                ORDER BY idOrdineAcquisto DESC
                LIMIT 12
            ")->fetchAll();

            $ordiniVendita = $db->query("
                SELECT ov.numeroOrdine AS id,
                       CONCAT(c.nome,' ',c.cognome) AS cliente,
                       DATE_FORMAT(ov.dataOrdine,'%d/%m/%Y') AS data,
                       ov.totaleOrdine AS totale,
                       COALESCE(fv.numeroFattura,'—') AS fattura,
                       COALESCE(p.metodoPagamento,'—') AS pagamento
                FROM ORDINE_VENDITA ov
                LEFT JOIN CLIENTI c  ON c.idCliente = ov.idCliente
                LEFT JOIN FATTURE_VENDITA fv ON fv.numeroOrdine = ov.numeroOrdine
                LEFT JOIN PAGAMENTI p ON p.numeroFattura = fv.numeroFattura
                ORDER BY ov.numeroOrdine DESC
                LIMIT 12
            ")->fetchAll();

            $materiali = $db->query("
                SELECT idMaterialeBase AS id, nomeMateriale AS nome,
                       costoUnitarioMedio AS costo, scortaMinima AS scorta,
                       fornitoriDisponibili AS fornitori
                FROM MATERIALI_BASE
                ORDER BY idMaterialeBase
            ")->fetchAll();

            $miscele = $db->query("
                SELECT m.idMiscela AS id, m.nomeMiscela AS nome,
                       m.statoMiscela AS stato, m.tempoMiscelazione AS tempo,
                       GROUP_CONCAT(mb.nomeMateriale ORDER BY mb.idMaterialeBase SEPARATOR '||') AS comp
                FROM MISCELE m
                LEFT JOIN COMPONE c ON c.idMiscela = m.idMiscela
                LEFT JOIN MATERIALI_BASE mb ON mb.idMaterialeBase = c.idMaterialeBase
                GROUP BY m.idMiscela
                ORDER BY m.idMiscela
            ")->fetchAll();

            foreach ($miscele as &$mi) {
                $mi['comp'] = $mi['comp'] ? explode('||', $mi['comp']) : [];
            }
            unset($mi);

            $sensori = $db->query("
                SELECT s.idSensore AS id, s.tipoSensore AS tipo,
                       s.unitaDiMisura AS unit, s.frequenzaLettura AS hz,
                       s.indirizzoIP AS ip,
                       m.nomeMacchina AS macch
                FROM SENSORI_IT s
                LEFT JOIN MACCHINARI m ON m.idMacchina = s.idMacchinaSensori
                WHERE s.attivo = 1
                ORDER BY s.idSensore
            ")->fetchAll();

            $storicoLetture = $db->query("
                SELECT DATE_FORMAT(ls.timeStampLettura,'%Y-%m-%d %H:%i:%s') AS ts,
                       s.idSensore AS id, s.tipoSensore AS tipo,
                       ls.valore AS val, s.unitaDiMisura AS unit,
                       m.nomeMacchina AS macch, s.indirizzoIP AS ip,
                       ls.anomalia
                FROM LETTURE_SENSORI ls
                JOIN SENSORI_IT s ON s.idSensore = ls.idSensore
                JOIN MACCHINARI m ON m.idMacchina = s.idMacchinaSensori
                ORDER BY ls.timeStampLettura DESC
                LIMIT 15
            ")->fetchAll();

            foreach ($storicoLetture as &$r) {
                $r['val']      = (float) $r['val'];
                $r['anomalia'] = (bool)  $r['anomalia'];
            }
            unset($r);

            $revData = $db->query("
                SELECT DATE_FORMAT(dataOrdine,'%d/%m/%Y') AS label,
                       SUM(totaleOrdine) AS val
                FROM ORDINE_VENDITA
                WHERE dataOrdine >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(dataOrdine)
                ORDER BY DATE(dataOrdine)
            ")->fetchAll();
            foreach ($revData as &$r) { $r['val'] = (int) $r['val']; }
            unset($r);

            $maxOA = $db->query("SELECT MAX(idOrdineAcquisto) AS m FROM ORDINI_ACQUISTO")->fetchColumn();
            $maxOV = $db->query("SELECT MAX(numeroOrdine) AS m FROM ORDINE_VENDITA")->fetchColumn();

            echo json_encode([
                'ok'             => true,
                'ordiniAcquisto' => $ordiniAcquisto,
                'ordiniVendita'  => $ordiniVendita,
                'materiali'      => $materiali,
                'miscele'        => $miscele,
                'sensori'        => $sensori,
                'storicoLetture' => $storicoLetture,
                'revData'        => $revData,
                'nextOA'         => (int)($maxOA ?? 1005) + 1,
                'nextOV'         => (int)($maxOV ?? 5)    + 1,
            ]);
            break;
        }

        case 'exec_query': {
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            $sqls = $body['sqls'] ?? [];
            if (is_string($sqls)) $sqls = [$sqls];

            $db = getDB();
            $affected     = 0;
            $results      = [];
            $lastInsertId = null;

            $db->beginTransaction();
            try {
                foreach ($sqls as $sql) {
                    $sql = trim($sql);
                    if ($sql === '') continue;

                    $verb = strtoupper(strtok($sql, " \t\n"));
                    if (!in_array($verb, ['SELECT','INSERT','UPDATE','DELETE'], true)) {
                        throw new RuntimeException("Operazione non consentita: $verb");
                    }

                    // Se questo è un INSERT su FATTURE_VENDITA e abbiamo appena
                    // inserito un ORDINE_VENDITA, sostituiamo il numeroOrdine JS
                    // con quello reale assegnato dall'AUTO_INCREMENT del DB.
                    if ($lastInsertId !== null
                        && $verb === 'INSERT'
                        && stripos($sql, 'FATTURE_VENDITA') !== false
                    ) {
                        // L'ultimo valore nella VALUES(...) è il numeroOrdine
                        $sql = preg_replace(
                            '/,\s*\d+\s*\)\s*$/',
                            ', ' . $lastInsertId . ')',
                            $sql
                        );
                    }

                    $stmt = $db->prepare($sql);
                    $stmt->execute();
                    $affected += $stmt->rowCount();

                    if ($verb === 'INSERT') {
                        $lastInsertId = (int) $db->lastInsertId();
                    }

                    if ($verb === 'SELECT') {
                        $results[] = $stmt->fetchAll();
                    }
                }
                $db->commit();
            } catch (Throwable $e) {
                $db->rollBack();
                echo json_encode(['ok' => false, 'error' => $e->getMessage(), 'affected' => 0]);
                exit;
            }

            echo json_encode(['ok' => true, 'affected' => $affected, 'results' => $results]);
            break;
        }

        case 'cleanup_readings': {
            $body    = json_decode(file_get_contents('php://input'), true) ?? [];
            $sensors = $body['sensors'] ?? [];

            $db = getDB();
            $db->beginTransaction();
            try {
                $deleted = $db->exec("DELETE FROM LETTURE_SENSORI");

                $now      = date('Y-m-d H:i:s');
                $inserted = 0;
                foreach ($sensors as $s) {
                    $stmt = $db->prepare("
                        INSERT INTO LETTURE_SENSORI (timeStampLettura, anomalia, valore, idSensore)
                        VALUES (:ts, :anom, :val, :id)
                    ");
                    $stmt->execute([
                        ':ts'   => $now,
                        ':anom' => (int)(bool)$s['anomalia'],
                        ':val'  => (float)$s['val'],
                        ':id'   => (int)$s['id'],
                    ]);
                    $inserted++;
                }

                $db->commit();
                echo json_encode([
                    'ok'       => true,
                    'deleted'  => $deleted,
                    'inserted' => $inserted,
                    'ts'       => $now,
                ]);
            } catch (Throwable $e) {
                $db->rollBack();
                echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
            }
            break;
        }

        case 'delete_order': {
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            $id   = (int)($body['id'] ?? 0);
            if ($id <= 0) {
                echo json_encode(['ok' => false, 'error' => 'ID non valido']);
                break;
            }

            $db   = getDB();
            $stmt = $db->prepare("
                DELETE FROM ORDINI_ACQUISTO
                WHERE idOrdineAcquisto = :id
                  AND statoOrdine = 'CONSEGNATO'
            ");
            $stmt->execute([':id' => $id]);

            echo json_encode([
                'ok'       => true,
                'affected' => $stmt->rowCount(),
                'id'       => $id,
            ]);
            break;
        }

        default:
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => "Azione sconosciuta: $action"]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}