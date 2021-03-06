// var requestify = require('requestify'),
//     cheerio = require('cheerio'),
//     mongoose = require('mongoose'),
//     startDb = require('../server/db'),
//     Job = mongoose.model('Job'),
//     PageTracker = mongoose.model('PageTracker');


// // create query object to be passed to api
// var query = {
//     "t.p": 42564,
//     "t.k": "hGbrCTwlKrc",
//     userip: "0.0.0.0",
//     useragent: "",
//     format: "json",
//     v: 1,
//     action: "employers",
//     pn: 1,
//     finishPn: 50,
//     l: "United States",
//     //q: "macy's",

//     //stores how many pages the query has returned
//     totalNumberOfPages: 0,

//     //keeps track of how many results have been processed relative all results
//     counter: 0,
//     resultLength: 0
// };


// // declare regular expressions
// const selectNonNumeric = /\D+/g;
// const removeHourlyMonthly = /\s-\s(hourly|monthly|contractor|hourly contractor)/ig;
// const findNA = /n\/a/ig;
// const dashifyUrl = /[\W_]+/g;
// const findAmpersand = /\s?&\s?/g;
// const dashAtEnd = /(^-?)(.*(?=.))(-?$)/;


// // trigger after db connection
// startDb
//   .then(() => PageTracker.findOne())
//   .then(data => {
//     if(!!data) {
//       query.pn = data.pageNumber;
//       data.pageNumber = query.finishPn = query.pn + 50;
//       return data.save();
//     } else return PageTracker.create({
//         pageNumber: 50
//     });
//   })
//   .then(() => pullCompanyPage(query, function keepGoing() {
//       query.pn++;
//       if (query.pn <= query.finishPn && query.pn <= query.totalNumberOfPages) return pullCompanyPage(query, keepGoing);
//       return query.pn === query.totalNumberOfPages ? PageTracker.findOne()
//         .then(data => {
//           data.pageNumber = 1;
//           return data.save();
//         }).then(end) : end();
//   }))
//   .catch(err => console.log(err));

// function end() {
//   console.log('\nDone at Last :)\n');
// }

// // pull one api page
// function pullCompanyPage(queryObject, nextCompPageCb) {
//     // log query page number
//     console.log(`Page ${query.pn} here we go!!!`);

//     // make request
//     requestify.request('http://api.glassdoor.com/api/api.htm', {
//             method: 'GET',
//             body: {},
//             // cookies: {
//             //     mySession: 'some cookie value'
//             // },
//             // auth: {
//             //     username: 'foo',
//             //     password: 'bar'
//             // },
//             dataType: 'json',
//             params: queryObject
//         })
//         .then(function(response) {
//             if (!response) return nextCompPageCb(false);

//             // get employers from response body
//             var employers = response.getBody().response.employers;

//             // keeps track of how many results have been processed relative all results
//             if (!queryObject.totalNumberOfPages) {
//                 queryObject.totalNumberOfPages = response.getBody().response.totalNumberOfPages;
//                 console.log('\n' + queryObject.totalNumberOfPages, 'pages total to go through \n');
//             }
//             queryObject.counter = 1;
//             queryObject.resultLength = employers.length;
//             console.log(queryObject.resultLength.toString(), 'employers on this page \n');

//             // loop through each employer, add salary data, then store information
//             return employers.forEach(function(val, index) {
//                 const id = val.id;
//                 const name = val.name.trim().replace(findAmpersand, '-and-').replace(dashifyUrl, '-').replace(dashAtEnd, '$2');

//                 // log employer ID and name
//                 console.log(name, '-', val.industry, '-', val.numberOfRatings);
//                 if (index + 1 === employers.length) console.log('');
//                 // create array to store salaries data
//                 val.salaries = [];

//                 return pullSalaryPage(val.salaries, name, id, '', function recurseCallBack(newPage) {
//                     // continue until last page then store results in database
//                     if (newPage) {
//                         // log current page number and name of company for entertainment :)
//                         console.log(newPage, '_', name);

//                         // continue to next page
//                         pullSalaryPage(val.salaries, name, id, newPage, recurseCallBack);
//                     } else {
//                         console.log('\n' + val.name, "done!!!!!");
//                         return Job.create({
//                             glassDoorId: id,
//                             name: val.name,
//                             website: val.website,
//                             industry: val.industry,
//                             numberOfRatings: val.numberOfRatings,
//                             squareLogo: val.squareLogo,
//                             overallRating: val.overallRating,
//                             ratingDescription: val.ratingDescription,
//                             cultureAndValuesRating: +val.cultureAndValuesRating,
//                             seniorLeadershipRating: +val.seniorLeadershipRating,
//                             compensationAndBenefitsRating: +val.compensationAndBenefitsRating,
//                             careerOpportunitiesRating: +val.careerOpportunitiesRating,
//                             workLifeBalanceRating: +val.workLifeBalanceRating,
//                             recommendToFriendRating: +val.recommendToFriendRating,
//                             ceo: val.ceo,
//                             salaries: val.salaries
//                         }, function(err, added) {
//                             if (err) {
//                                 if (err.code === 11000) console.log('\n' + val.name, "already exists :(");
//                                 else console.log(err);
//                             } else console.log('\n' + val.name, "added!!!!!!!!!!");
//                             queryObject.counter++;
//                             return queryObject.counter >= queryObject.resultLength ?
//                                 nextCompPageCb() :
//                                 console.log('\n' + (queryObject.resultLength - queryObject.counter), 'more left \n');
//                         });
//                     }
//                 });
//             });
//         }).catch((err) => console.log(err));
// }


// // pull data from a salary page
// function pullSalaryPage(dataArr, name, id, page, nextSalPageCb) {
//     requestify.get('https://www.glassdoor.com/Salary/' + name + '-Salaries-E' + id + page + '.htm').then(function(html) {
//         //load response into cheerio, i.e. server jQuery
//         var $ = cheerio.load(html.getBody());

//         //detect if this is the last page, if not store next page string
//         var lastPage = !!$('.pagingControls ul .current.last').html() ? true : !$('.pagingControls ul .current').html() ? true : false;
//         page = lastPage ? null : !page.length ? '_P2' : '_P' + (+page.slice(2) + 1);

//         //grab sections containing individual role salary info
//         var jobSections = $('.jobTitleCol');

//         //initialize variables for use in loop
//         var title = '';
//         var salary = 0;
//         var sampleSize = 0;
//         var lowEnd = '';
//         var highEnd = '';

//         //data handling
//         var salaryFactor = 0;

//         jobSections.each(function(i, item) {
//             // jQuery-ify 'item'
//             item = $(item);

//             // populate vars with page content
//             title = item.find('span.i-occ.strong.noMargVert').html().trim();
//             salary = item.find('.meanPay').html().replace(selectNonNumeric, '');
//             sampleSize = item.find('.salaryCount').html().replace(selectNonNumeric, '');

//             // deal with hourly and monthly pay
//             salaryFactor = title.indexOf('Hourly') >= 0 ? salaryFactor = 2000 : title.indexOf('Monthly') >= 0 ? 12 : 1;

//             // store low end and high end of range
//             lowEnd = item.find('.rangeValues .alignLt').html().replace(selectNonNumeric, '') *
//                 salaryFactor * (salaryFactor < 2000 ? 1000 : 1);
//             highEnd = item.find('.rangeValues .alignRt').html().replace(selectNonNumeric, '') *
//                 salaryFactor * (salaryFactor < 2000 ? 1000 : 1);

//             // handles if salary is "n/a"
//             if (findNA.test(salary)) salary = (lowEnd + highEnd) / 2;
//             else salary = salary * salaryFactor;

//             // push results to array
//             dataArr.push({
//                 title: title.trim().replace(removeHourlyMonthly, ''),
//                 salary: salary,
//                 lowEnd: lowEnd,
//                 highEnd: highEnd,
//                 sampleSize: +sampleSize.slice(0, sampleSize.indexOf(' '))
//             });
//         });
//         // trigger callback if provided, feeding in next page number (null if last page)
//         return nextSalPageCb ? nextSalPageCb(page) : null;
//     })
//     .catch((err) => {
//       if(err.code !== 11000) {
//         console.log(name, ' ', id);
//         console.log(err);
//       }
//     });
// }
