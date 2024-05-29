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
const sdk_1 = require("@directus/sdk");
const directus_1 = require("../directus");
const mysql_client_1 = require("../mysql-client");
const env_1 = require("../env");
const date_fns_1 = require("date-fns");
const p_map_1 = __importDefault(require("@cjs-exporter/p-map"));
const sync_1 = require("./sync");
function removeItemHLink(startDate, endDate) {
    return directus_1.directusClient.request((0, sdk_1.deleteItems)("visitdrug", {
        filter: {
            pcucode: { _eq: env_1.env.PCU_CODE },
            dateupdate: {
                _gte: startDate,
                _lt: endDate,
            },
        },
    }));
}
function countAll(startDate) {
    return __awaiter(this, void 0, void 0, function* () {
        const [{ count: countHLinkServer }] = yield directus_1.directusClient.request((0, sdk_1.aggregate)("visitdrug", {
            query: {
                filter: {
                    pcucode: { _eq: env_1.env.PCU_CODE },
                    dateupdate: { _gte: startDate },
                },
            },
            aggregate: { count: ["*"] },
        }));
        const [data] = yield mysql_client_1.pool.query(`select
      count(*) as count
    from visitdrug v
    where dateupdate >= ? and pcucode = ? and dateupdate >=?`, [env_1.env.DRUG_SYNC_START_DATE, env_1.env.PCU_CODE, startDate]);
        if (parseInt(countHLinkServer) !== data[0].count) {
            console.log(`countAll jhcis: ${data[0].count} hlink: ${countHLinkServer}`);
            yield countMonth(startDate);
        }
    });
}
function countMonth(startDate) {
    return __awaiter(this, void 0, void 0, function* () {
        const [jhcisData] = yield mysql_client_1.pool.query(`select YEAR(dateupdate) as year, MONTH(dateupdate) as month, count(*) as count
    from visitdrug v
    where dateupdate >= ? and pcucode = ? and dateupdate >=?
    group by YEAR(dateupdate), MONTH(dateupdate)`, [env_1.env.DRUG_SYNC_START_DATE, env_1.env.PCU_CODE, startDate]);
        yield (0, p_map_1.default)(jhcisData, (jD) => __awaiter(this, void 0, void 0, function* () {
            const startDateOfThisMonth = `${jD.year}-${jD.month
                .toString()
                .padStart(2, "0")}-01`;
            const startDateOfNextMonth = `${jD.year}-${(jD.month + 1)
                .toString()
                .padStart(2, "0")}-01`;
            const hlinkData = yield directus_1.directusClient.request((0, sdk_1.aggregate)("visitdrug", {
                query: {
                    filter: {
                        pcucode: { _eq: env_1.env.PCU_CODE },
                        dateupdate: {
                            _gte: startDateOfThisMonth,
                            _lt: startDateOfNextMonth,
                        },
                    },
                },
                aggregate: { count: ["*"] },
            }));
            if (parseInt(hlinkData[0].count) !== jD.count) {
                console.log(`countMonth ${startDateOfThisMonth} jhcis: ${jD.count}  hlink: ${hlinkData[0].count}`);
                yield countDay(startDateOfThisMonth, startDateOfNextMonth, startDate);
            }
        }), { concurrency: 1 });
    });
}
function countDay(startDateOfThisMonth, startDateOfNextMonth, startDate) {
    return __awaiter(this, void 0, void 0, function* () {
        const [jhcisData] = yield mysql_client_1.pool.query(`select DATE(dateupdate) as dateupdate, count(*) as count
    from visitdrug v
    where dateupdate >= ? and pcucode = ? and dateupdate >= ? and dateupdate >= ? and dateupdate < ?
    group by DATE(dateupdate)`, [
            env_1.env.DRUG_SYNC_START_DATE,
            env_1.env.PCU_CODE,
            startDate,
            startDateOfThisMonth,
            startDateOfNextMonth,
        ]);
        yield (0, p_map_1.default)(jhcisData, (jD) => __awaiter(this, void 0, void 0, function* () {
            const thisDate = (0, date_fns_1.format)(jD.dateupdate, "yyyy-MM-dd");
            if (thisDate === (0, date_fns_1.format)(new Date(), "yyyy-MM-dd")) {
                // prevent bug when today is not finished
                console.log("skip today");
                return Promise.resolve();
            }
            const nextDate = (0, date_fns_1.format)((0, date_fns_1.addDays)(jD.dateupdate, 1), "yyyy-MM-dd");
            const hlinkData = yield directus_1.directusClient.request((0, sdk_1.aggregate)("visitdrug", {
                query: {
                    filter: {
                        pcucode: { _eq: env_1.env.PCU_CODE },
                        dateupdate: {
                            _gte: thisDate,
                            _lt: nextDate,
                        },
                    },
                },
                aggregate: { count: ["*"] },
            }));
            if (parseInt(hlinkData[0].count) !== jD.count) {
                console.log(`countDay ${thisDate} jhcis: ${jD.count}  hlink: ${hlinkData[0].count}`);
                yield removeItemHLink(thisDate, nextDate);
                const visitdate = yield (0, sync_1.listJhcisVisitDrugItem)(thisDate, nextDate);
                yield (0, sync_1.insertJhcisVisitdrugItemToDirectus)(visitdate);
            }
        }), { concurrency: 1 });
    });
}
const oneYearAgo = (0, date_fns_1.format)((0, date_fns_1.startOfDay)((0, date_fns_1.addYears)(new Date(), -1)), "yyyy-MM-dd");
countAll(oneYearAgo)
    .then(() => {
    console.log("done resync visitdrug", new Date().toISOString());
})
    .catch((e) => {
    console.error(e);
});
