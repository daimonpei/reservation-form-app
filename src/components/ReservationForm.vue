<script setup lang="ts">
import { ref, onMounted } from "vue";
import dayjs from "dayjs";
// import { API, graphqlOperation } from "@aws-amplify/api";
// import { createTodo } from "../graphql/mutations";
// import { listTodos } from "../graphql/queries";
// import { onCreateTodo } from '../graphql/subscriptions';
// import { OnCreateTodoSubscription } from "../API";
import { parse, ParsedUrlQuery } from 'querystring';
import { conditionalExpression } from "@babel/types";
import { domainToASCII } from "url";

// type OnCreateTodoSubscriptionData = {
//   value: { data: OnCreateTodoSubscription };
// };

// defineProps<{ msg: string }>();

// const count = ref(0)

// window.LOG_LEVEL = 'VERBOSE';






// const todos = ref([]);
// const createNewTodo = async () => {
//   const todo = { name: "Todo Title", description: "あれをやる" + Date() };
//   await API.graphql(graphqlOperation(createTodo, { input: todo }));
//   getData();
// };

// const getData = async (serchParam: ParsedUrlQuery) => {
//   console.log('getdata', serchParam);
//   const todoData = await API.graphql(graphqlOperation(listTodos));
//   todos.value = todoData.data.listTodos.items;
// };

// const subscription = API.graphql(graphqlOperation(onCreateTodo));
// if ("subscribe" in subscription) {
//   subscription.subscribe({
//     next: ({ value: { data } }: OnCreateTodoSubscriptionData) => {
//       if (data.onCreateTodo) {
//         todos.value.shift(data);
//       }
//     },
//     error: (error) => {
//       console.warn(error);
//     },
//   });
// }
const week = ['日', '月', '火', '水', '木', '金', '土'];
const domain = ref('');
const appId = ref('');
const apiToken = ref('');
const category = ref('');
const mode = ref('');
const date = ref('');
const days = ref([]);
const times = ref([]);
const st = ref('');
const ed = ref('');
const records = ref([]);
const reserves = ref({});
const format = (str, format) => {
  return dayjs(str).format(format)
}
const modeName = (mode) => {
  let name;
  switch (mode) { 
    case 'month':
      name = '月';
      break;
    case 'week':
      name = '週';
      break;
    case 'day':
    default:
      name = '日';
      break;
  }
  return name;
}
onMounted(() => {
  console.log('mounted!')
  const searchParam = parse(window.location.search.replace('?', ''));
  console.log({ searchParam });
  //lbo-for-takeout.cybozu.com
  //CeebNpIkNHsYVxEY8Tb6cNcl1CoGbezdMN3THtdr
  domain.value = searchParam.domain;
  appId.value = searchParam.appId;
  apiToken.value = searchParam.apiToken;
  category.value = searchParam.category;
  mode.value = searchParam.mode;
  date.value = searchParam.date;

  times.value = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  ]

  let condition = `TITLE = "${category.value}"`;
  switch (mode.value) {
    case 'month'://空きのある日を特定する
      st.value = dayjs(date.value).startOf('month').format('YYYY-MM-DDT00:00:00+09:00');
      ed.value = dayjs(date.value).endOf('month').format('YYYY-MM-DDT23:59:59+09:00');
      condition += ` and 開始 <= "${ed.value}" or 終了 >= "${st.value}"`;
      break;
    case 'week':
      st.value = dayjs(date.value).startOf('week').format('YYYY-MM-DDT00:00:00+09:00');
      ed.value = dayjs(date.value).endOf('week').format('YYYY-MM-DDT23:59:59+09:00');
      condition += ` and 開始 <= "${ed.value}" or 終了 >= "${st.value}"`;
      days.value = [];
      for (let i = 0; i < 7; i++) {
        days.value.push(dayjs(st.value).add(i, 'day'))
      }
      break;
    case 'day':
    default:
      break;
  }


  console.log({ condition });
  const endpoint = 'https://3umy426uam6j5ilq2j44d5khna0zoskh.lambda-url.ap-northeast-1.on.aws/';
  const param = {
    domain: domain.value,
    apiToken: apiToken.value,
    type: 'record',
    method: 'getAllRecords',
    param: {
      app: appId.value,
      condition: condition
    }
  };
  console.log({ param });
  fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(param)
  }).then((response) => response.json())
    .then((data) => {
      console.log({data});
      records.value = data;
      reserves.value = {};
      let k;
      data.filter(r => {
        return r.予約.value === '空';
      }).forEach(r => {
        k = dayjs(r.開始.value).format('MMDDHH:00');
        reserves.value[k] = reserves.value[k] ? reserves.value[k].concat([r]) : [r];
      });
      console.log({reserves})
    });
});




</script>

<template>
  <div>
    <!-- <button @click="createNewTodo">Add Todo</button> -->
    <h1>{{category}}の予約</h1>
    <h2>{{modeName(mode)}} {{ format(st, 'MM-DD') }} - {{ format(ed, 'MM-DD') }}</h2>
    <!-- <ul>
      <li v-for="(r) in records.sort((a, b) => {
        return dayjs(b.開始).diff(a.開始);
      })" :key="r.$id.value">
        {{ format(r.開始.value, 'MM/DD HH:mm') }}
        - {{ format(r.開始.value, 'MM/DD HH:mm') }} : 
        {{ r.予約.value }}
      </li>
    </ul> -->

    <table>
      <thead>
        <tr>
          <th></th>
          <th v-for="day in days" :key="day">
            {{ format(day, 'D') }}<br>
            {{ week[format(day, 'd')] }}
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="time in times" :key="time">
          <th>{{time}}</th>
          <td v-for="day in days" :key="day">
            <div v-if="reserves[format(day, 'MMDD') + time] && reserves[format(day, 'MMDD') + time].length > 0">
              <b>◎</b>
              <!-- <b>{{ reserves[format(day, 'MMDD') + time].length }}</b> -->
            </div>
            <div v-else> - </div>
          </td>
          <th>{{time}}</th>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
body{
  background-color: rgb(39, 64, 70);
}
</style>
<style scoped>
h1,h2,h3,h4,h5,p,ul,li{
  margin: 0;
  padding: 0;
}
h1{
  font-size: 18px;
  line-height: 1.8em;
}
h2{
  font-size: 16px;;
  line-height: 1.6em;
}
ul{
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  border: 1px solid #fff;
  justify-content: center;
}
li{
  padding: 0.25em;
  margin: 0.25em;
  border: 1px solid #ddd;
}

table{
  width: 100%;
  border-collapse: collapse;
}
th, td{
  border: 1px solid #555;
  padding: 0.25em 0;
  width: calc(100% / 9);
}
th{
  background-color: rgb(77, 105, 111);
  font-size: 14px;
  line-height: 1.25em;
}
td{
  background-color: rgb(127, 140, 143);
}
th:first-child,
th:last-child{
  font-size: 13px;
}
</style>
