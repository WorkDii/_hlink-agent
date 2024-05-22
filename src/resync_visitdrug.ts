import { aggregate, readItemPermissions } from "@directus/sdk";
import { directusClient } from "./directus";
import { pool } from "./mysql-client";
import { env } from "./env";
import { RowDataPacket } from "mysql2";
import { addYears, format, startOfDay } from "date-fns";
import pMap from "@cjs-exporter/p-map";

async function countAll(startDate: string) {
  const [{ count: countHLinkServer }] = await directusClient.request<
    { pcucode: string; count: string }[]
  >(
    aggregate("visitdrug", {
      query: {
        filter: {
          pcucode: { _eq: env.PCU_CODE },
          dateupdate: { _gte: startDate },
        },
      },
      aggregate: { count: ["*"] },
      groupBy: ["pcucode"],
    })
  );

  const [data] = await pool.query<(RowDataPacket & { count: Number })[]>(
    `select
      count(*) as count
    from visitdrug v
    where dateupdate >= ? and pcucode = ? and dateupdate >=?`,
    [env.DRUG_SYNC_START_DATE, env.PCU_CODE, startDate]
  );

  console.log(countHLinkServer, data[0].count);
  if (parseInt(countHLinkServer) !== data[0].count) {
    await countMonth(startDate);
  }
}

async function countMonth(startDate: string) {
  const data = await directusClient.request<
    {
      pcucode: string;
      dateupdate_year: string;
      dateupdate_month: string;
      count: string;
    }[]
  >(
    aggregate("visitdrug", {
      query: {
        filter: {
          pcucode: { _eq: env.PCU_CODE },
          dateupdate: { _gte: startDate },
        },
      },
      aggregate: { count: ["*"] },
      groupBy: ["pcucode", "year(dateupdate)", "month(dateupdate)"],
    })
  );

  // หาวันที่ ข้อมูลจาก 2 ทีเท่ากัน
  const listDateNotEqual = [];
  await pMap(
    data,
    (d) => {
      pool.query(
        `select
        count(*) as count
      from visitdrug v
      where dateupdate >= ? and pcucode = ? and dateupdate >=?`,
        [env.DRUG_SYNC_START_DATE, env.PCU_CODE, startDate]
      );
    },
    { concurrency: 1 }
  );
  console.log(2, data);
}
// async function test() {
//   const d = await directusClient.request(
//     aggregate("visitdrug", {
//       aggregate: { count: ["*"] },
//       groupBy: [
//         "pcucode",
//         "year(dateupdate)",
//         "month(dateupdate)",
//         "day(dateupdate)",
//       ],
//     })
//   );
//   console.log(d);
// }

const oneYearAgo = format(startOfDay(addYears(new Date(), -1)), "yyyy-MM-dd");
countAll(oneYearAgo)
  .then(() => {
    console.log("done");
  })
  .catch((e) => {
    console.error(e);
  });
