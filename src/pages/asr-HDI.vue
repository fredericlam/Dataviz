<template>

	<div class="container">
		
		<div class="model" id="model1">
			<div class="row">

				<div class="col">

					<h1>
						ASR (World), Incidence / Mortality, all cancers, both sexes
						<div class="sub_title">
						Each circle represent a country, colored by incidence or mortality. Size of circle are mapped with the population size (<a href="/data/hdi_2020_i_m.json" target="_blank">Click here for the complete dataset in json file</a>).
						</div>

						<form name="filters" class="form form-title">

							<FloatLabel class="w-full md:w-80">

								<MultiSelect v-model="points" :options="countries" optionLabel="label" optionValue="country" filter placeholder="Select countries" size="small" class="w-full md:w-80" @change="onChange($event)" />
							</FloatLabel>

							<!--<Button label="Submit" size="small" />-->
						</form>
					</h1>
					
					<!--<form name="">
						<select name="points" multiple="true" v-model="points">
							
						</select>
					</form>-->

					<div id="graphic"></div>

					<div class="source"> 
						Source: 2023/09 - <a href="https://gco.iarc.who.int">GCO</a> - <a href="https://gco.iarc.fr/today">Globocan {{ year }}</a> - Ferlay J, Ervik M, Lam F, Colombet M, Mery L, Piñeros M, Znaor A, Soerjomataram I, Bray F (2020). <br> Global Cancer Observatory: Cancer Today. Lyon, France: International Agency for Research on Cancer. Available from: https://gco.iarc.fr/today, accessed [DD Month YYYY].
					</div>
				</div>

			</div><!-- end row -->

		</div><!-- end model1 -->


	</div>

</template>

<script>

// from https://github.com/MartinHeinz/charts/blob/master/beeswarm/beeswarm.js
import { reactive,computed,onMounted } from "vue";
import axios from 'axios'
import Button from "primevue/button"
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import FloatLabel from 'primevue/floatlabel';

export default {
	name : 'ASR-HDI-Component' , 
	components : { Button , Select , MultiSelect , FloatLabel } , 
	setup(){ 
		onMounted(() => {

			let scripts = [
		      '/js/d3.v5.min.js'
		    ] 

		    var tag_script 
		    for ( var s in scripts ){
		      // eslint-disable-next-line
		      var tag_script = document.createElement("script")
		      tag_script.type  = "text/javascript"
		      tag_script.src   = scripts[s]
		      tag_script.async = true
		      // tag_script = loadAsynScript(scripts[s]) ; 
		      document.body.appendChild(tag_script)
		    }
		    
   		})
   		  	
  		return {
	  
	  }
	},
	data() {
	    return {
	    	year : 2020 , 
	    	// svg conf
	    	width: 0 ,
	    	height : 0 , 
	    	margin : {top: 10, right: 40, bottom: 130, left: 80} ,

	    	x_scale : [] , 
	    	x_axis : [] ,

	    	y_scale : [] , 
	    	y_axis : [] ,

	    	color_scale : {} , 
	    	colors : ["#4682B4","#dc143c"] ,

	    	// options 
	    	scales : {
			    lin: "scaleLinear",
			    log: "scaleLog"
			},

			// Data structure describing volume of displayed data
			count : {
			    total: "total",
			    perCap: "perCapita"
			},

			// Data structure describing legend fields value
			legend : {
			    total: "Total Deaths",
			    perCap: "Per Capita Deaths"
			},

			dataset : [] ,

			chartState : {} , 

			filters : {} , 

			max_radius : 15 , 

			sort_by : 'Lower',
			sort_dir : 'asc' , 

			steps : []  ,

			hdi_threshold : [
				{ key : 1 , point_text : .42 , index_min : 0.4 , index_max : 0.550 , name : 'Low HDI' } , 
				{ key : 2 , point_text : .62 , index_min : 0.550 , index_max : 0.699 , name : 'Medium HDI' } , 
				{ key : 3 , point_text : .75 , index_min : 0.700 , index_max : 0.799 , name : 'High HDI' } , 
				{ key : 4 , point_text : .9 , index_min : 0.800 , index_max : 1 , name : 'Very High HDI' , hide_line : true }
			], 

			selectedCountry : 250 , 

			points : [160,752,76] , // 76,

			annotations : [] , 

			countries : []

	    }
	},
	created(){	
	},
	mounted(){
		
	    setTimeout(()=>{

			this.width = $('#graphic').width() ; 
			this.height = ( $(window).height() < 600 ) ? $(window).height() - 80 : 800 ; 
			
			// console.info("this.height",$(window).height(),this.height) ; 

			// create svg
			this.svg = d3.select('#graphic').append("svg")
				.attr('id','graphic')
		      	.attr("width", this.width )
		      	.attr("height", this.height )
		      	.attr("viewBox", [0, 0, this.width, this.height])
		      	//.attr("style", "max-width: 100%; height: auto;")

		    this.tooltip = d3.select('#graphic').append('div')
				.attr('class','tooltip_viz') 
				.style('opacity',0)
			; 

		    // this.y_scale = d3.scaleLinear()
	    		//.range([this.margin.top, this.height - this.margin.bottom- this.margin.top]);

	    	this.svg.append("g")
			    .attr("class", "y axis")
			   	.attr("transform", `translate(${this.margin.left},0)`) 
			   	.attr("text-anchor","end")
			   	// + (this.height - this.margin.bottom) + ")");
			
			this.g_circles = this.svg.append('g')
		        .attr('class','group_circles') 
			    //.attr("transform", `translate(${this.margin.left},0)`) 
			   	// ${this.margin.top})`) 

			this.svg.append("g")
			    .attr("class", "x axis")
			    .attr("transform", `translate(0,${this.height-this.margin.bottom})`) 

			this.xLine = this.svg.append("line")
			    .attr("stroke", "rgb(96,125,139)")
			    .attr("stroke-dasharray", "1,2");

			this.chartState.measure = this.count.total ;
			this.chartState.scale 	= this.scales.lin ;
			this.chartState.legend 	= this.legend.total ;

			let promise = axios.get( "../data/hdi_2020_i_m.json" ) ; 

			axios.all( [promise] )
				.then( axios.spread(( dataset_promise ) => {

					this.countries = d3.nest()
						.key( d => d.country )
						.entries( dataset_promise.data ) 
						.map( m => {
							return {
								country : parseFloat( m.key ) , 
								label : m.values[0].label
							} ; 
						})
						.sort((a,b)=>{
							if (a.label < b.label) {
						    	return -1;
						  	}
						  	if (a.label > b.label) {
						    	return 1;
					  		}
						  	return 0;
						})
					; 

					// console.info(" countries " , this.countries )
					
					this.dataset = dataset_promise.data
						.filter( f => f.hdi_value < 1 )
						.map( d => {
							return {
								id : `dot-${d.country}-${d.type}-${d.sex}-${d.cancer}` , 
								label : d.label , 
								continent : d.continent , 
								country : d.country , 
								type : d.type , 
								sex : d.sex , 
								asr : d.asr , 
								total_population : d.total_population , 
								hdi : d.hdi , 
								hdi_value : d.hdi_value , 
								cancer : d.cancer , 
								color : this.colors[d.type]
							}
						})
						.sort((a,b)=>{
							return a.hdi_value - b.hdi_value
						})
					;

					// console.log(this.dataset);

					setTimeout(() => { this.initGraphic() }, 1000 )
					setTimeout(() => { this.showLegend() }, 1000 )
					setTimeout(() => { this.drawLines()} , 5000 )
					setTimeout(() => { this.setAnnotations() ; } , 7500 )

				}))
		        
		        // eslint-disable-next-line
		        .catch( error => {
		            console.error("Error catched",error) ; 
		            this.error = true
		        })
		        .finally(() => {
		        
		        })
		},750)
	},

	unmounted(){

	},

	methods : {

		setLegend : function( legends ){

			this.svg.select('g.legend').remove();
			
			this.g_legend = this.svg.append('g')
				.attr('class','legend')
				.attr('transform',`translate(40,${this.height-(this.margin.bottom/2)})`)

			// this.legend = 
			// .data(this.dataset, d => d.id );
			this.legends = this.g_legend.selectAll(".color")
	            .data( legends , d => d.color );

	        this.legends_subgroups = this.legends
	        	.enter()
	            .append("g")
	            .attr("class", "group") ; 

	        let l_width = 110 ; 

	        this.legends_subgroups
	        	.append('circle')
	            .attr("r",6)
	            .attr("cx",(c,i)=>{
	            	let width = ( i == 1 ) ? 90 : l_width ;
	            	return width*i;
	            })
            	.attr("cy",10) 
            	.attr("fill",f=>f.color)
            	.style("stroke","#000")
	            .style("stroke-width","0.5px")
            ; 

            this.legends_subgroups
            	.append('text')
            	.attr("x",(c,i)=>{
            		let width = ( i == 1 ) ? 90 : l_width ;
	            	return (width*i)+20;
	            })
            	.attr("y",15) 
            	.attr("text-anchor","start")
	            .text( t => t.edu )
		},

		resetAll : function(){

			this.filters.educations.forEach( e => {
				this.steps[ e.edu ] = false ; 
			})

			this.g_circles.selectAll(".country")
				.transition()
	            .duration(2500)
	            .attr("cy",c => {
	            	return  this.height-this.margin.bottom
	            })
	            .style("opacity",0)

		}, 

		startAnimation : function( edu ){

			let animate ; 

			this.steps[edu] = !this.steps[edu] ;

			// go up or down
			// console.info("animate",edu,this.steps[edu]) ; 
			// console.table(this.steps); 

			// return ; 

			// fade - in
			if ( this.steps[edu] == true )
			{
				this.g_circles.selectAll(".country")
					.style('opacity', o => {
						let opacity = 0 ; 
						if ( o.asr == 'NA') opacity = 0 ;
						else if ( this.steps[o.edu] == true ) opacity = 1 ;
						return opacity ;
					})
					.attr("cy",c => {
						if ( this.steps[c.edu] == true && c.edu != edu )
							return this.y_scale(c.asr)
						else
							return  this.height-this.margin.bottom
					})
					.transition()
		            .duration(2000)
		            .attr("cy",c => {
						if ( this.steps[c.edu] == true )
	            			return this.y_scale(c.asr)
	            	})
		            .style('opacity', o => {
		            	let opacity = 0 ; 
						if ( o.asr == 'NA') opacity = 0 ;
						else if ( o.edu == edu || this.steps[o.edu] == true) opacity = 1 ;
						return opacity ; 
					})
			}		
			else
			{

			}

		},

		mouseOut : function(){

			this.g_circles.selectAll(".country")
				.style('opacity',o => {
					if ( o.asr == 'NA') return 0 ; 
					return 1 ; 
				}) ; 

		} , 

		selectCountry( label ){

			// console.table(this.steps);

			this.g_circles.selectAll(".country")
				.style('opacity',o => {
					// console.info("this.steps[o.edu]",o.country,o.edu,this.steps[o.edu]) ; 
					if ( o.asr == 'NA') return 0 ; 
					else if ( o.country == label && this.steps[o.edu] == true ) return 1 ; 
					else if ( this.steps[o.edu] == true ) return 0.1 ; 
					return 0 ; 
				})

		} , 

		deselectCountry(){
			this.g_circles.selectAll(".country")
				.style('opacity',o => {
					if ( o.asr == 'NA') return 0 ; 
					else if ( this.steps[o.edu] == true ) return 1 ; 
					return 0 ; 
				}) ; 
		},

		/**
		* Redraw graphic
		* @param (bool) init or not
		* @return (no return )
		*/
		initGraphic : function( init ){

			// console.info("Sorting","sort_by",this.sort_by,"sort_dir",this.sort_dir)

			// legend
			// this.setLegend( this.filters.colors );

			this.dataset.map( m => {
				m.sort = m.total_population  ; 
				return m ; 
			})

			this.dataset_sorted = this.dataset
				.sort((a, b)=> {
					if ( this.sort_dir == 'desc') 
						return (b.sort - a.sort) ;
					else
					 	return (a.sort - b.sort) ;
				})
				// .sort((a, b)=> b.asr - a.asr)
            ;

            if ( this.sort_dir == 'asc') 
            	this.dataset_sorted = this.dataset_sorted.filter(f=>f.sort!=0) ; //.reverse() ;

			// console.table(this.dataset_sorted) ; 

		 	this.x_scale = d3.scaleLinear()
			 	.domain( [ 0.3 , 1 ] )
	        	.range([ this.margin.left , this.width - this.margin.right ]) 
	        	.nice()
	        	//.paddingInner(1)
	        ;
	        
	        let pops = this.dataset.map( t => t.total_population ) ; 
	        let min_pop =  d3.min( pops ) , max_pop = d3.max( pops ) ;

	        this.r_scale = d3.scaleSqrt()
	        	.domain( [ min_pop , max_pop ] )
	        	.range( [ 0 , this.max_radius ] )

			// Set scale type based on button clicked
	        if (this.chartState.scale === this.scales.lin) {
	            this.y_scale = d3.scaleLinear()
	            	.range([this.height-this.margin.bottom,this.margin.top]) //.range([ this.margin.top , this.height - this.margin.bottom ])
	        }

	        if (this.chartState.scale === this.scales.log) {
	            //this.y_scale = d3.scaleLog().range([0,this.height]) //.range([ this.margin.top, this.height - this.margin.bottom ]);
	        }

	        this.domains = d3.extent(this.dataset, (d)=> {
            	return +d.asr ;
        	}); 
        	

	        this.y_scale.domain([0,this.domains[1]] ).nice() ;

	       	//console.log("this.filters.populations.map( p => p.iso )",this.filters.populations.map( p => p.iso )) ;

	        // Set X axis based on new scale. If chart is set to "per capita" use numbers with one decimal point
	        if (this.chartState.measure === this.count.perCap) {
	            this.y_axis = d3.axisLeft(this.y_scale)
	                .ticks(10, ".1f")
	                .tickSizeOuter(0);
	        }
	        else {
	            this.y_axis = d3.axisLeft(this.y_scale)
	                .ticks(10)
	                .tickSize(-(this.width-this.margin.left-this.margin.right))
	                .tickSizeOuter(1)

	            ;

	            this.x_axis = d3.axisBottom(this.x_scale)
	            	.ticks(6)
	            	//.tickFormat("")
	        }
	        // console.info("this.x_scale",this.x_scale)

	        d3.transition(this.svg).select(".y.axis")
	            .transition()
	            .duration(2500)
	            .call(this.y_axis);

	        d3.transition(this.svg).select(".x.axis")
	            .transition()
	            .duration(2500)
	            .call(this.x_axis);

	        

	        this.circles = this.g_circles.selectAll(".country")
	            .data(this.dataset, d => d.id );

	        this.circles.exit()
	            .transition()
	            .duration(2500)
	            .remove();

	        this.circles.enter()
	            .append("circle")
	            .attr("class", "country")
	            .attr("cx", d=>this.x_scale(d.hdi_value))
            	.attr("cy",this.height-this.margin.bottom)
	            .attr("r", d => this.r_scale(d.total_population))
	            .attr("fill","transparent")
	            .attr("stroke", d=>d.color)
	            .style("stroke-width","2px") //function(d){ return colors(d.continent)})
	            .style("opacity",0)
	            .transition()
	            .duration(2500)
	            .attr("cx", d=>this.x_scale(d.hdi_value))
            	.attr("cy",d=>this.y_scale(d.asr))
	            .style("opacity",1)

	        
			
			// console.info("regressionPoints",regressionPoints);

			return ; 
		
		},

		drawLines : function(){

			// return ; 
	        let inc_data = this.dataset.filter( d => d.type == 0 ).sort( (a,b) => a.hdi_value - b.hdi_value ) ; 
	        let mort_data = this.dataset.filter( d => d.type == 1 ).sort( (a,b) => a.hdi_value - b.hdi_value ) ; 
	        
	        // console.info("inc_data",inc_data.map(d => [d.hdi_value, d.asr])) ;
	        
	        let loess = science.stats.loess().bandwidth( 1 ) ;
	        let loess_values = {
				inc : loess( inc_data.map( i => i.hdi_value ) , inc_data.map( i => i.asr ) ),
				mort : loess( mort_data.map( i => i.hdi_value ) , mort_data.map( i => i.asr ) )
			}

			let inc_data_loess = loess_values.inc.map( (l,i) => {
				return {  x : inc_data[i].hdi_value , y : l }
			})

			let mort_data_loess = loess_values.mort.map( (l,i) => {
				return {  x : mort_data[i].hdi_value , y : l }
			})

			// console.info("loess_values",inc_data_loess) ; 
		

	        let linearRegression_output = { 
	        	inc : linearRegression(inc_data.map(d => [d.hdi_value, d.asr])) , 
	        	mort : linearRegression(mort_data.map(d => [d.hdi_value, d.asr])) 
	        }

	        let linearRegressionLine_output = {
	        	inc : linearRegressionLine(linearRegression_output.inc),
	        	mort : linearRegressionLine(linearRegression_output.mort)
	        }

			const xCoordinates = {
				inc : [inc_data[0].hdi_value, inc_data.slice(-1)[0].hdi_value] , 
				mort : [mort_data[0].hdi_value, mort_data.slice(-1)[0].hdi_value] 
			}

			let regressionPoints =  {
				inc : xCoordinates.inc.map( d => ({
						x : d , // We pick x and y arbitrarily, just make sure they match d3.line accessors
						y : linearRegressionLine_output.inc(d)
					})) , 
				mort : xCoordinates.mort.map( d => ({
						x : d , // We pick x and y arbitrarily, just make sure they match d3.line accessors
						y : linearRegressionLine_output.mort(d)
					})) 
			}

			this.line_incidence = d3.line()
			  .x(d => this.x_scale(d.x))
			  .y(d => this.y_scale(d.y))
			  //.curve(d3.curveLinear)

			let line_loess = d3.line()
			  .x(d => this.x_scale(d.x))
			  .y(d => this.y_scale(d.y))
			  .curve(d3.curveNatural)

	        /*this.svg.append("path")   
			    .attr("class", "line line-incidence")
			    .attr("fill","none")
			    .attr("stroke",this.colors[0])
			    .attr("stroke-width","5px")
			    .datum( regressionPoints.inc )
			    .attr("d", this.line_incidence )
			;*/

			this.svg.append("path")   
			    .attr("class", "line line-incidence-loess")
			    .attr("fill","none")
			    .attr("stroke",this.colors[0])
			    .attr("stroke-width","5px")
			    .datum( inc_data_loess )
			    .attr("d", line_loess )
			;

			/* this.svg.append("path")   
			    .attr("class", "line line-mortality")
			    .attr("fill","none")
			    .attr("stroke",this.colors[1])
			    .attr("stroke-width","5px")
			    .datum( regressionPoints.mort )
			    .attr("d", this.line_incidence )
			;*/

			this.svg.append("path")   
			    .attr("class", "line line-mortality-loess")
			    .attr("fill","none")
			    .attr("stroke",this.colors[1])
			    .attr("stroke-width","5px")
			    .datum( mort_data_loess )
			    .attr("d", line_loess )
			;
	        
	        this.g_circles.selectAll(".country")
	        	
	        	.on("mousemove", (event, d) => {

	        		let pointer = d3.pointer(event,this.g_circles.node())

		        	this.tooltip.html(`
		        		<h5>${d.label}</h5>
		        		<table>
		        			<tr>
		        				<td class="metric">Population</td>
		        				<td class="value">${d3.format(".2s")(d.total_population)}</td>
		        			</tr>
		        			<tr>
		        				<td class="metric">HDI (rank)</td>
		        				<td class="value">${d.hdi_value} (${d.hdi})</td>
		        			</tr>
		        			<tr>
		        				<td class="metric">ASR</td>
		        				<td class="value">${d.asr.toFixed(2)}</td>
		        			</tr>
		        		</table>
		        		`)
		            .style('top', pointer[1] - 130 + 'px')
		            .style('left', pointer[0] - 120  + 'px')
		            .style('display','block')
		            .style("opacity", 0.9);
		    	})

	            .on("mouseout", (_)=> {
		        	this.tooltip
		        		.style("top", 0)
		        		.style("left", 0)
		        		.style("opacity", 0);
		            //this.xLine.attr("opacity", 0);
	        	}) 
	        ;

	        // if ( init == true ) return ; 

	        this.circles
	            .transition()
	            .duration(2250)
	            .attr("cx", d=>this.x_scale(d.hdi_value))
            	.attr("cy",d=>this.y_scale(d.asr))
	            .style("opacity",1)
	            //.attr('attr-edu', e => e.edu )
	    },

	    onChange : function( event ){

	    	/* console.info("onChange",{
	    		event : event , 
	    		points : this.points
	    	})*/

	    	this.setAnnotations() ; 

	    },

	    setAnnotations : function(){

	    	d3.selectAll('.annotation-group .annotations').remove();
	    	this.annotations = [] ; 

	    	// console.log("this.points",this.points) ; 

	        // annotations
	        this.points.forEach( point => {

	        	let annotations_base = this.dataset
	        		.filter( d => d.country == point ) 
	        		.map( d => {
	        			return {
	        				name : d.label  , 
	        				country : point , 
		        			x : d.hdi_value ,
		        			y : d.asr , 
		        			type : d.type , 
		        			total_population : d.total_population
	        			}
	        		})
	        	; 

	        	// console.info("annotations_base",annotations_base) ; 

	        	annotations_base.forEach( a => {

	        		let y = (a.type == 1)?100:-100  ;
	        		let x = (a.country==160)?-50:50 ; 

	        		// specific mortality china
	        		if ( a.country == 160 && a.type == 1) y = 200 ; 

		        	this.annotations.push(
					  {
					    note : { title: a.name , label : ( a.type == 0 ) ? 'Incidence' : 'Mortality'  },
					    x : this.x_scale(a.x) ,
					    y : this.y_scale(a.y) ,
					    dy : y ,
					    dx : x ,
					    // type : d3.annotationLabel ,
					    type : d3.annotationCalloutCircle ,
					    connector : { end: "arrow" },
					    subject: {
						   radius: this.r_scale( a.total_population ),
						   radiusPadding: 0
						},
						color : this.colors[a.type]
					  }
					) ;

				})	
	        })

			let makeAnnotations = d3.annotation().annotations( this.annotations );

			this.g_annotations = this.g_circles
			  	.append("g")
			  	.attr("class", "annotation-group")
			  	.call( makeAnnotations )

			$('form[name="filters"]').show() 
		},

		showLegend : function(){
	           
	        // lines hdi
	        this.g_hdi_lines = this.svg.append("g").attr("class","g_hdi_lines")
	        
	        this.hdi_lines = this.g_hdi_lines.selectAll(".hdi_lines")
	            .data(this.hdi_threshold.filter( h => h.hdi_line != false) );

	        this.hdi_lines.enter()
	            .append("line")
	            .attr("class", "hdi_lines")
	            .attr("x1",d => this.x_scale(d.index_max))
	            .attr("x2",d => this.x_scale(d.index_max))
	            .attr("y1",this.height-this.margin.bottom)
	            .attr("y2",this.margin.top)
	            .attr("stroke","#ccc")
	            .attr("stroke-width","2px")
	            .attr("stroke-dasharray","4")

	        this.hdi_text = this.g_hdi_lines.selectAll(".hdi_lines")
	            .data(this.hdi_threshold ) ;

			this.hdi_lines.enter()
	            .append("text")
	            .attr("class","hdi_axis")
	            .attr("y",this.margin.top + 30)	
	            .attr("x",d => {
	            	return this.x_scale(d.point_text)
	            })
	            .text( d => d.name ) 
	            .attr("fill","#000s")
	            .attr("text-anchor","middle")

	        this.svg.append("text")
	        	.attr('class','legendAxis')
	        	.attr("y",10)
	        	.attr("x",-(this.height/2))
	        	.attr("transform","rotate(-90)")
	        	.text("Age-standardized rate (World)")

	        this.svg.append("text")
	        	.attr('class','legendAxis')
	        	.attr("x",(this.width/2)-this.margin.left)
	        	.attr("y",this.height-60)
	        	.text("Human Development Index")

	        // legend incidence mortality
	        let pos_y_legend = this.height-80 ; 

	        var ordinal = d3.scaleOrdinal()
			  .domain(["Incidence", "Mortality"])
			  .range( this.colors )
			;

			this.svg.append("g")
			  .attr("class", "legendColorLine")
			  .attr("transform", `translate(${this.width-250},${pos_y_legend})`);

			var legendSizeLine = d3.legendColor()
		      .scale(ordinal)
		      //.labelWrap(30)
		      .shape("rect")
		      .shapeWidth(100)
		      .shapeHeight(5)
		      //.labelAlign("middle")
		      .shapePadding(10);

			this.svg.select(".legendColorLine")
			  .call(legendSizeLine);

			var linearSize = d3.scaleLinear()
				.domain( [ 1000000 , 10000000 ] )
	        	.range( [ 5 , this.max_radius ] )

			this.svg.append("g")
			  .attr("class", "legendSize")
			  .attr("transform", `translate(${this.margin.left},${pos_y_legend})`);

			var legendSize = d3.legendSize()
				.labelFormat(d3.format(".2s"))
				.scale(linearSize)
				.shape('circle')
				.shapePadding(35)
				.labelOffset(20)
				.orient('horizontal')
			;

			this.svg.select(".legendSize")
			  .call( legendSize );


	    } // end redraw

	}

}

</script>

<style lang="scss">

h1{
	padding: 20px 0 50px 40px;
	font-size: 1.6em;
	text-align: left ;
	font-weight: 900;
}

form[name="filters"]{
	display: none ; 
}


.model{
	padding-bottom: 100px ;
	.story{
		padding-left: 40px;
		a.link_step{
			display: block ; 
			font-size: 1.2em;
			padding: 0 5px;
			width: 100%;
			height: 100%;
			&:hover{
				background: #f0f0f0 ; 
				text-decoration: none!important;
			}
			span.step_marker{
				padding: 10px; 
				display: block;
				margin: auto ; 
				text-align: center;
			}
			span.step_marker_white{
				color: #fff ; 
			}
		}
		button#btn-reset{
			float: right;
   	 		margin-right: 40px;
		}
	}
}

#countries_list{
	.list-group-item{
		&:hover{
			background: #f0f0f0 ; 
		}
		a.country_button{
			text-decoration: none!important;
			display: block;
			font-size: .9em;
			&:hover{
				text-decoration: none!important;
			}
			img{
				height: 10px;
			}
		}
	}
}

#graphic{
	position: relative ; 
}


g.x.axis{
	.tick{
		text{
			font-size: 1.4em;
		}
	}
}

g.y.axis{
	.tick{
		line{
			stroke: #ccc ;
		}
		text{
			font-size: 1.4em;
		}
	}
}

.filters{
	padding-top: 20px;
	.legend{
		padding-left:0 ;
	}
}

svg{
	path.subject{
		stroke: none ;
	}
	text.annotation-note-title{
		font-size: 1em;
		font-weight: bold;
	}
	text.annotation-note-label{
		font-size: .8em;
	}
	g.y.axis{
		path{
			display: none ; 
		}
	}
}

.legendAxis{
	font-weight: 800 ; 
}

.hdi_axis{
	font-weight: 300;
}

.legendColorLine,.legendSize{
	text{
		font-size: 12px;
		font-weight: 500 ; 
	}
	circle{
		stroke : #000 ;
		stroke-width: 2px; 
		fill: #fff ;
	}
}


</style>