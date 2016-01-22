app.directive('dataline', function($timeout,$window, $interval, $rootScope, glassData) {

    const splitIntoThree = /\d{3}/g;
    const putCommasInThoseBitches = function(num) {
        if(typeof num !== 'string') num = num.toString();
        return num.slice(0, num%3).concat(',', num.match(splitIntoThree).join(','));
    };

    var lineCirclesLink = function(scope, element, attrs) {

        var dirty = false; // checks for one succesful render to direct to render or getNewData, should probs make these the same if we can

        const startData = 6,
        rMin = 10, // min radius size
        rMax = 35, // max radius size
        rProperty = "overallRating"; // "r" property will always be sampleSize

        // Re-draw pies upon changes to 'passedData'
        scope.$watch('lineData', (newVal, oldVal) =>
            dirty ?
            getNewData(scope.lineData, scope.lineId, startData) :
            render(scope.lineData, scope.lineId));

        scope.xProp = "salary"; // initialize xProp with salary

        function render(data, typeProp) {
            if(!data.length) return;
            dirty = true;
            //bad form must fix
            data = glassData.filterByProp(typeProp, data);
            data = data.slice(data.length-7, data.length);

            // console.log(data)
            const lineToAppendTo = d3.select("#" + scope.lineId);
            const tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html((d) => typeProp === 'company' ?
                        `<span>${d[typeProp]}</span><br><span>${d.jobTitle}</span><br><span>$${scope.xProp === 'salary' && d[scope.xProp] ? putCommasInThoseBitches(d[scope.xProp]) : d[scope.xProp]}</span><br><span> work/life: ${d[rProperty]}</span>` :
                        `<span>${d[typeProp]}</span><br><span>$${scope.xProp === 'salary' && d[scope.xProp] ? putCommasInThoseBitches(d[scope.xProp]) : d[scope.xProp]}</span><br><span> work/life: ${d[rProperty]}</span>`);
            lineToAppendTo.call(tip); // attach hover info to bubbles

            const xScale = d3.scale.linear().domain(d3.extent(data, (d) => d[scope.xProp])) // scaling x-axis, so values al fit on line and are relative
                .range([300, 1100]);

            const rScale = d3.scale.linear().domain([1,5]) // scaling radius size
                .range([rMin, rMax]);

            const circles = lineToAppendTo
                .selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("class", "data-line-circles")
                .attr("fill", (d) => d[rProperty] <2.5 ? 'red' : 'grey');

            circles
                .attr("cy", (d) => 200)
                .attr("cx", (d,i) => i*100+300)
                .attr('r', 0)
                .transition()
                .delay((d,i)=>(i*50))
                .attr("r",  (d) => rScale(d[rProperty]));

            circles
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .on('click', (d) =>
                    scope.filterLines({
                        prop: scope.lineId,
                        val: d[scope.lineId]
                    }));
        }

        function getNewData(data, typeProp, dataposition) {
            const newData = glassData.filterByProp(typeProp, data);
            // console.log('hit directive '+ typeProp);
            // console.log(dataposition, newData);
            newData = newData.slice(dataposition,dataposition+6)
            // console.log('newData', newData);

            const xScale = d3.scale.linear().domain(d3.extent(data, (d) => d[scope.xProp])) // scaling x-axis, so values al fit on line and are relative
                .range([300, 1100]);

            const rScale = d3.scale.linear().domain([1,5]) // scaling radius size
                .range([rMin, rMax]);

            const circles = d3.selectAll('circle');

            circles
                .transition()
                .attr('r', 0);

            circles
                .data(newData)
                .attr("cy", (d) => 200)
                .attr("cx", (d,i)=> i*100+300);

            circles
                .transition()
                .delay((d,i)=>(i*50))
                .attr("r",(d) => rScale(d[rProperty]))
                .transition()
                .delay('1000')
                .attr("fill", (d) => d[rProperty] <2.5 ? 'red' : 'grey');

            dataposition = dataposition >= data.length-1 ? dataposition + 6 : dataposition = 0;
        }

    };

    return {
        restrict: 'E',
        scope: {
            lineId: '@',
            viewLabel: '@',
            filterLines: '&',
            lineData: '='
        },
        templateUrl: 'app/common/directives/dataLine/dataLine.html',
        link: lineCirclesLink
    };
});
