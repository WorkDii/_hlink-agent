"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSync = exports.insertJhcisVisitdrugItemToDirectus = exports.listJhcisVisitDrugItem = void 0;
const env_1 = require("../env");
const mysql_client_1 = require("../mysql-client");
const directus_1 = require("../directus");
const sdk_1 = require("@directus/sdk");
const date_fns_1 = require("date-fns");
const node_cron_1 = __importDefault(require("node-cron"));
const p_map_1 = __importDefault(require("@cjs-exporter/p-map"));
const DEFAULT_SCHEDULE = "30 * * * *";
function listJhcisVisitDrugItem(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        const [data] = yield mysql_client_1.pool.query(`select
      visitno, v.drugcode, costprice, realprice, dateupdate, pcucode, unit, c.drugcode24, c.drugtype
    from visitdrug v
      left join cdrug c on c.drugcode = v.drugcode
    where dateupdate >= ? ${startDate ? "and dateupdate >= ?" : ""} ${endDate ? "and dateupdate < ?" : ""}
    ORDER by  dateupdate asc`, [env_1.env.DRUG_SYNC_START_DATE, startDate, endDate]);
        return data;
    });
}
exports.listJhcisVisitDrugItem = listJhcisVisitDrugItem;
function insertJhcisVisitdrugItemToDirectus(data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, p_map_1.default)(data, (d, i) => __awaiter(this, void 0, void 0, function* () {
            // check if drugcode24 is exist fine hospital_drug id
            if (d.drugcode24) {
                const hospitalDrug = yield directus_1.directusClient.request((0, sdk_1.readItems)("hospital_drug", {
                    filter: { drugcode24: { _eq: d.drugcode24 } },
                    fields: ["id"],
                }));
                d.hospital_drug = hospitalDrug.length ? hospitalDrug[0].id : null;
            }
            yield directus_1.directusClient.request((0, sdk_1.deleteItems)("visitdrug", {
                filter: {
                    _and: [
                        { visitno: { _eq: d.visitno } },
                        { drugcode: { _eq: d.drugcode } },
                        { pcucode: { _eq: d.pcucode } },
                    ],
                },
            }));
            const inserted = yield directus_1.directusClient.request((0, sdk_1.createItem)("visitdrug", d));
            console.log("inserted", JSON.stringify(inserted), `index: ${i + 1}/${data.length}`);
            return inserted;
        }), { concurrency: 1, stopOnError: false });
    });
}
exports.insertJhcisVisitdrugItemToDirectus = insertJhcisVisitdrugItemToDirectus;
function jhcis2hlink() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const getLastHlinkData = yield directus_1.directusClient.request((0, sdk_1.readItems)("visitdrug", {
                sort: ["-dateupdate"],
                limit: 1,
                fields: ["dateupdate"],
            }));
            if (getLastHlinkData.length) {
                const lastDateUpdate = getLastHlinkData[0].dateupdate;
                const visitdrug = yield listJhcisVisitDrugItem((0, date_fns_1.format)((0, date_fns_1.addMilliseconds)(lastDateUpdate, 1), "yyyy-MM-dd HH:mm:ss"));
                yield insertJhcisVisitdrugItemToDirectus(visitdrug);
                console.log("finish");
            }
            else {
                const visitdrug = yield listJhcisVisitDrugItem();
                yield insertJhcisVisitdrugItemToDirectus(visitdrug);
                console.log("finish");
            }
        }
        catch (error) {
            console.log(error);
        }
    });
}
function startSync() {
    console.log("start sync visitdrug", new Date());
    const schedule = env_1.env.DRUG_SYNC_SCHEDULE || DEFAULT_SCHEDULE;
    console.log("initial sync on start");
    jhcis2hlink();
    node_cron_1.default.schedule(schedule, () => {
        console.log(`running a task every ${schedule} NOW IS `, new Date());
        jhcis2hlink();
    });
}
exports.startSync = startSync;
