<template>

	<div class="container">

		<div class="model" id="model1">

			<!-- HEADER: Title and Toggle -->
			<header class="page-header">
				<h1 v-if="is_age_specific==false">Age-standardized rate (World) per 100 000, incidence & mortality, {{ selectedSex == 2 ? 'females' : 'males' }}</h1>
				<h1 v-if="is_age_specific==true">Rates per 100 000 by period, Age-specific, Korea (5 registries), incidence, {{ selectedSex == 2 ? 'females' : 'males' }}</h1>
				<div class="sex-toggle" style="opacity: 0;">
					<button
						:class="['btn-toggle', { active: selectedSex == 2 }]"
						@click="toggleSex(2)">Females</button>
					<button
						:class="['btn-toggle', { active: selectedSex == 1 }]"
						@click="toggleSex(1)">Males</button>
				</div>
			</header>

			<!-- CONTENT: Graphic + Legend -->
			<div class="content-row">

				<div class="graphic-col">
					<div id="graphic"></div>
					<div class="source">
						<span v-if="is_age_specific==false"><strong>Data source</strong>: <a href="https://gco.iarc.who.int" target="_blank">Global Cancer Observatory</a>, <a href="https://gco.iarc.who.int/overtime" target="_blank">Cancer Over Time</a></span>
						<span v-if="is_age_specific==true"><strong>Data source</strong>: <a href="https://ci5.iarc.fr/ci5plus" target="_blank">CI5plus: Cancer Incidence in Five Continents Time Trends</a></span>
					</div>
				</div>

				<div class="legend-col">
					<div class="filters">
						<form>
							
							<div class="row" v-if="is_age_specific==false">

								<!-- France & USA -->
								<div class="col-md-12" v-for="(pop, i) in pops.filter(p => p.group == 'main')" :key="pop.country">
									<p class="step1">
										<a href="#" class="link_step">
											<span class="step_marker step_marker_white" :style="{ 'background-color': pop.color }">
												<i class='fas fa-check'></i>
												{{ pop.label }}
											</span>
										</a>
									</p>
								</div>

								<!-- Top incidence countries -->
								<div class="col-md-12 legend-title">
									<strong>Top 4 {{ selectedSex == 2 ? 'females' : 'males' }}</strong>
								</div>

								<div class="col-md-12" v-for="(pop, i) in pops.filter(p => p.group == 'top')" :key="pop.country">
									<p class="step1">
										<a href="#" class="link_step">
											<span class="step_marker step_marker_white" :style="{ 'background-color': pop.color }">
												<i class='fas fa-check'></i>
												{{ pop.label }}
											</span>
										</a>
									</p>
								</div>

								<!-- Spacer to push Korea to bottom -->
								<div class="flex-spacer"></div>

								<!-- Korea separate at bottom -->
								<div class="col-md-12 korea-section">
									<p class="step2">
										<a href="#" class="link_step" v-on:click="startAnimation()">
										<span class="step_marker step_marker_white" :style="{ 'background-color': pops.find(p => p.group == 'korea').color }">
											<i class='fas fa-check' v-if="animate==true"></i>Republic of Korea</span>
										</a>
									</p>
								</div>
							</div>

							<div class="row" v-if="is_age_specific==true">


								<div class="col-md-12" v-for="(period,i) in pops">
									<p class="step1">
										<a href="#" :class="'link_step '+period.class">
											<label :for="'checkbox_'+i">
												<input type="checkbox" v-model="lines_checkbox" :value="period.label" :id="'checkbox_'+i" v-on:change="periodAnimation()">
												<span class="step_marker" :style="{ 'background-color': period.color }">
													<i class='fas fa-check'></i>
													{{ period.label }} 
												</span>
												
											</label>
										</a>
									</p>
								</div>

							</div>
							
							<!--<div class="col-md-3">
								<button type="button" class="btn btn-primary mb-3" id="btn-reset" v-on:click="resetAll">
									Reset all
								</button>
							</div>-->

						</form>

					</div>

				</div>

			</div><!-- end content-row -->

		</div><!-- end model1 -->

	</div>

</template>

<script>

// from https://github.com/MartinHeinz/charts/blob/master/beeswarm/beeswarm.js

import { reactive,computed,onMounted } from "vue";
import { useStore } from 'vuex' ;
import axios from 'axios'

export default {
	name : 'Thyroid' , 
	components : { } , 
	setup(){ 
		onMounted(() => {

   	})
   	
   	const store = useStore()
  	
  	return {
	  
	  }
	},
	data() {
	    return {

	    	// svg conf
	    	width: 0 ,
	    	height : 0 , 
	    	margin : {top: 30, right: 240, bottom: 70, left: 70} ,

	    	x_scale : [] , 
	    	x_axis : [] ,

	    	y_scale : [] , 
	    	y_axis : [] ,

	    	color_scale : {} , 
	    	colors : ["#ffbc42","#d81159","#218380"] ,

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

			all_values : [] ,
			dataset : [] ,
			rawDataset : null , // store raw data for sex toggle

			chartState : {} , 

			filters : {} , 

			sort_by : 'Lower',
			sort_dir : 'asc' , 

			steps : []  ,

			animate : false ,

			axis : {
				x : [ 1980 , 2024 ]
			},
			pops : [
				{ country : 250 , label : 'France' , color : "#3b82f6" , highlight : true , group: 'main' } ,
				{ country : 840 , label : 'USA' , color : "#1d4ed8" , highlight : true , group: 'main' } ,
				{ country : 196 , label : 'Cyprus' , color : "#0891b2" , highlight : true , group: 'top' } ,
				{ country : 218 , label : 'Ecuador' , color : "#0ea5e9" , highlight : true , group: 'top' } ,
				{ country : 160 , label : 'China' , color : "#6366f1" , highlight : true , group: 'top' } ,
				{ country : 792 , label : 'Türkiye' , color : "#9b5de5" , highlight : true , group: 'top' } ,
				{ country : 410 , label : 'Republic of Korea' , color : "#90be6d" , highlight : true , group: 'korea' }
			] ,
			defaultLineColor : '#cccccc' , 

			target_country : 410 ,

			is_age_specific : false ,

			selectedSex : 2 , // 1 = male, 2 = female (default)

			lines_checkbox : []
	    }
	},
	created(){	
	},
	mounted(){

		let scripts = [
	      '/js/d3@7.js'
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


	    setTimeout(()=>{
	    	
			this.is_age_specific = ( this.$router.currentRoute.value.name == 'thyroid_age' ) ? true : false  

			if ( this.is_age_specific == true ){
				this.pops = [
					{ label : '1999-2000' , color : "#ef476f" , checked : false } ,
					{ label : '2001-2003' , color : "#ffd166" , checked : false } ,
					{ label : '2004-2006' , color : "#06d6a0" , checked : false } ,
					{ label : '2007-2009' , color : "#118ab2" , checked : false } ,
					{ label : '2010-2012' , color : "#073b4c" , checked : false , class : 'span_white' } ,

				] ; 
			}

			// Calculate dimensions - use full available height
			const windowHeight = $(window).height() ;
			const windowWidth = $(window).width() ;

			// Reserve space for header (~60px) and source (~30px) and padding
			const headerHeight = 60 ;
			const sourceHeight = 30 ;
			const verticalPadding = 24 ;

			// Use remaining height for the chart
			this.height = windowHeight - headerHeight - sourceHeight - verticalPadding ;

			// Width: full width minus legend column (220px) and padding
			const legendWidth = 180 ;
			const horizontalPadding = 48 ;
			const availableWidth = windowWidth - legendWidth - horizontalPadding ;
			this.width = Math.min( availableWidth, this.height * 1.6 ) ; 
			
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
			
			this.group_lines = this.svg.append('g')
		        .attr('class','group_lines') 
			    //.attr("transform", `translate(${this.margin.left},0)`) 
			   	// ${this.margin.top})`) 

			this.legend_lines = this.svg.append('g')
		        .attr('class','legend_lines') 

			this.svg.append("g")
			    .attr("class", "x axis")
			    .attr("transform", `translate(0,${this.height-this.margin.bottom})`) 

			this.chartState.measure = this.count.total ;
			this.chartState.scale 	= this.scales.lin ;
			this.chartState.legend 	= this.legend.total ;



			// let promise = axios.get( "../data/dataset-thyroid-v2.json" ) ; 
			let promise = axios.get( "../data/dataset-thyroid-v3.json" ) ; 

			if ( this.is_age_specific == true ){
				promise = axios.get( "../data/dataset-age-specific.json" ) ; 
			}

			axios.all( [promise] )
				.then( axios.spread(( dataset_promise ) => {

					console.info( "dataset_promise" , dataset_promise.data )

					// Store raw data for sex toggle
					this.rawDataset = dataset_promise.data ;

					// Process data based on selected sex
					this.processData() ;

					setTimeout(() => {
						this.redraw( true );
					}, 7000 )
					
					
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

		/**
		* Process raw data based on selected sex
		*/
		processData : function() {
			// Clear existing data
			this.dataset = [] ;
			this.all_values = [] ;

			if ( !this.rawDataset ) return ;

			let tmp_dataset = [] , key_ ;

			if ( this.is_age_specific == true )
			{
				key_ = 'period' ;
				tmp_dataset = this.rawDataset
					.map( d => {
						let m = d.age.split('-') ;
						return {
							id : `plot-${d.age}-period-${d.period}` ,
							period : d.period ,
							type : 0 ,
							age : d.age ,
							y : parseFloat(m[0]) ,
							asr : parseFloat(d.rate)
						}
					}) ;
			}
			else
			{
				key_ = 'country' ;
				tmp_dataset = this.rawDataset.dataset
					.filter( f => f.sex == this.selectedSex )
					.map( d => {
						return {
							id : `dot-${d.id}-${d.type}-${d.sex}` ,
							country : d.country ,
							year : d.year ,
							sex : d.sex ,
							type : d.type ,
							asr : parseFloat(d.asr)
						}
					}) ;
			}

			let lines_dataset = d3.group(tmp_dataset, d => d[key_] , d => d.type ) ;
			let line , values = [] ;

			lines_dataset.forEach( c => {
				c.forEach( t => {
					values = [] ;

					t.forEach( s => {
						let obj = { asr : s.asr , year : s.year , country : s.country , period : s.period , age : s.age , y : s.y } ;
						this.all_values.push(obj) ;
						values.push(obj) ;
						line = {
							id : s.id ,
							country : s.country ,
							period : s.period ,
							type : s.type ,
							sex : s.sex ,
							age : s.age ,
							y : s.y
						}
					})

					let item = this.pops.find( p => line.country == p.country )

					if ( this.is_age_specific == true ){
						item = this.pops.find( p => line.period == p.label )
					}

					// Use default grey for non-highlighted countries, colored for highlighted ones
					if ( item && item.highlight ) {
						line.color = item.color
						line.highlight = true
					} else {
						line.color = this.defaultLineColor
						line.highlight = false
					}
					// Mortality lines (type == 1) are red and dotted
					if ( line.type == 1 ) {
						line.color = '#dc2626' ;
					}
					line.dash = ( line.type == 0 ) ? false : true ;
					line.values = values ;

					this.dataset.push( line ) ;
				});
			})

			this.filters.years = Array.from( d3.group( this.all_values , d => d.year ) )
				.map( m => {
					return { year : m[0] }
				})

			this.filters.colors = [] ;
		},

		/**
		* Toggle between male and female data
		* @param {number} sex - 1 for male, 2 for female
		*/
		toggleSex : function( sex ) {
			if ( this.selectedSex == sex ) return ;

			this.selectedSex = sex ;

			// Clear existing lines from SVG
			this.group_lines.selectAll('.path_lines').remove() ;
			this.legend_lines.selectAll('.line_legend').remove() ;
			this.legend_lines.selectAll('.text_legend').remove() ;

			// Reprocess data and redraw
			this.processData() ;
			this.redraw( true ) ;
		},

		resetAll : function(){

			this.filters.educations.forEach( e => {
				this.steps[ e.edu ] = false ; 
			})

			this.g_circles.selectAll(".country")
				.transition()
	            .duration(500)
	            .attr("cy",c => {
	            	return  this.height-this.margin.bottom
	            })
	            .style("opacity",0)

		},  
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
		redraw : function( init , label ){

			// legend
			// console.info("dataset",this.dataset,this.all_values) ;
			let dataset_in = [] , all_values_in = [] ;

			// Adjust right margin when Korea is shown (longer label)
			if ( this.animate == true ) {
				this.margin.right = 280 ;
			} else {
				this.margin.right = 200 ;
			}

			// Recalculate width based on viewport
			const windowWidth = $(window).width() ;
			const legendWidth = 180 ;
			const horizontalPadding = 48 ;
			const availableWidth = windowWidth - legendWidth - horizontalPadding ;
			this.width = Math.min( availableWidth, this.height * 1.6 ) + ( this.animate ? 80 : 0 ) ;

			// Update SVG dimensions
			this.svg
				.attr("width", this.width)
				.attr("viewBox", [0, 0, this.width, this.height]) ;

			if ( this.is_age_specific == true ){
				dataset_in = this.dataset
					.filter( c => {
						return this.lines_checkbox.includes( c.period )
					})
				all_values_in = this.all_values
			} else if ( this.animate == true ) {
				// Show all countries including Korea
				dataset_in = this.dataset
				all_values_in = this.all_values
			} else {
				// Hide Korea by default
				dataset_in = this.dataset.filter( c => c.country != this.target_country )
				all_values_in = this.all_values.filter( c => c.country != this.target_country )
			}

			// console.log("dataset_in",dataset_in);
		 	
	        if ( this.is_age_specific == true ){

	        	// console.info("this all_values",this.all_values) ;

	        	this.filters.years = Array.from( d3.group( this.all_values , d => d.y ) )
					.map( m =>{ 
						//console.info("m",m) ;
						// return { y : parseFloat(m[0].replace('+','')) } 
						return { y :m[0] } 
					})

				let x_axis_ticks = this.filters.years.map( p => p.y ) ; 
				// console.info("x_axis_ticks",x_axis_ticks) ;

	        	this.x_scale = d3.scaleLinear()
				 	.domain( [0,85] ) //this.filters.years.map( p => p.y ) )
				 	// .ticks(15)
		        	.rangeRound([ this.margin.left , this.width - this.margin.right ]) 
		        	//.paddingInner(1)
		        ;
	        } else {
	        	this.x_scale = d3.scaleLinear()
				 	//.domain( this.filters.years.map( p => p.year ) )
				 	.domain( this.axis.x )
		        	.rangeRound([ this.margin.left , this.width - this.margin.right ]) 
		        	//.paddingInner(1)
		        ;
	        }
	        
			// Set scale type based on button clicked
	        if (this.chartState.scale === this.scales.lin) {
	            this.y_scale = d3.scaleLinear().range([this.height-this.margin.bottom,this.margin.top]) //.range([ this.margin.top , this.height - this.margin.bottom ])
	        }

	        if (this.chartState.scale === this.scales.log) {
	            //this.y_scale = d3.scaleLog().range([0,this.height]) //.range([ this.margin.top, this.height - this.margin.bottom ]);
	        }

	        this.domains = d3.extent( all_values_in , (d)=> {
            	return +d.asr ;
        	}); 
	        this.y_scale.domain([0,this.domains[1]] ).nice() ;

	       	this.line = d3.line()
	            .x((d)=>{ return this.x_scale( (this.is_age_specific==true) ? d.y : d.year ); })
	            .y((d)=>{ return this.y_scale( d.asr ); })
	            .curve( d3.curveBasis )
	        ;

	        // Set X axis based on new scale. If chart is set to "per capita" use numbers with one decimal point

            this.y_axis = d3.axisLeft(this.y_scale)
                .ticks(10)
                .tickSize(-(this.width-this.margin.left-this.margin.right))
                .tickSizeOuter(1)
            ;

            this.x_axis = d3.axisBottom(this.x_scale)
            	.ticks(10)
            	.tickFormat(d=>{
            		return ( this.is_age_specific == true ) ? d : parseFloat(d)
            	})
	        // console.info("this.x_scale",this.x_scale)

	        this.transition_duration = 3500 ; 

	        d3.transition(this.svg).select(".y.axis")
	            .transition()
	            .duration(this.transition_duration)
	            .call(this.y_axis);

	        d3.transition(this.svg).select(".x.axis")
	            .transition()
	            .duration(this.transition_duration)
	            .call(this.x_axis);

          	this.lines = this.group_lines.selectAll('.path_lines')
            	.data( dataset_in , d => d.id );

            let lines_tran = this.lines
	            .enter()
	            .append("path")
	            .attr('class','path_lines')
	            .attr('id',(d)=>{ return d.id ; })
	            .attr("d", (d) => { return this.line(d.values) ; })
	            .attr("stroke", (d, i)=>{ return d.color })
	            .style("stroke-width", 3)
	            .attr('stroke-dasharray',(d)=>{ 
	                return (d.dash == true) ? 5 : 0 ; 
	            })
	            .attr("fill", "none") 
	        ;

	        lines_tran.call(line_transition, this.transition_duration ); 

	        	this.lines
	            .transition()
	            .duration( this.transition_duration )
	            .attr("d", (d) => { return this.line(d.values) ; })

	        this.lines
	            .exit()
	            .remove() ; 

	        this.buildLinesLegend( dataset_in ) ; 

	    } ,  // end redraw

	    startAnimation : function(){

	    	this.animate = !this.animate ;

	    	this.redraw();

	    } , 

	    periodAnimation : function( label ){

	    	// console.info("lines_checkbox",this.lines_checkbox) ;

	    	// let item = this.pops.find( p => p.label == label )
	    	this.redraw( false , label );

	    },

	    /**
	    * Create right legend once
	    * @param no param
	    */
	    buildLinesLegend : function( dataset_in ){

	    	/*this.legend_lines
	    		.selectAll('.line_legend')
	    		.remove()
	    	;

	    	this.legend_lines
	    		.selectAll('.text_legend')
	    		.remove()
	    	;*/

	        let d ; 
	        let spaces_y = [] ; 
	        let y ; 
	        let str; 
	        
	        let values = [] , latest_x , latest_y , legends_texts_domain ; 

	        // get last values of lines 
	        this.sorted_legends = [] ; 
	        this.legends_texts = [] ; 

	        if ( this.is_age_specific == true )
	        	legends_texts_domain = [{period:"2001-2003",pos_x:50},{period:"2004-2006",pos_x:50}] ; 
	        else 
	        	legends_texts_domain = { 0 : 'incidence' , 1 : 'Mortality'} ; 
	        
	        // console.info("dataset_in",dataset_in) ;
	        dataset_in.forEach((d,i)=>{

	        	let last_pos = d.values[d.values.length-1] , text_pos , pos_start , row_txt , item = null ;

	        	if ( this.is_age_specific == true ){
	        		if ( d.period != "1999-2000"){
	        			last_pos = d.values.find( d => d.y == 50 ) ;
	        		}
	        		text_pos =  {x:95,y:last_pos.asr} ;
	        		pos_start = {x:last_pos.y,y:last_pos.asr}  ;
	        	} else {
	        		item = this.pops.find( p => d.country == p.country && p.highlight )
	        		let is_targeted = dataset_in.find( c => c.country == this.target_country )
	        		let y_end = last_pos.asr + ( ( is_targeted != undefined && d.country == 84000 ) ? 5 : 0 ) ; //( is_targeted != undefined ) ? 60 : 16 ;
	        		text_pos = (d.type == 1 ) ? {y:0.5,x:2025} : {y:y_end,x:2025} ;
	        		pos_start = {x:last_pos.year,y:last_pos.asr}  ;
	        	}

	        	// Only display legend for highlighted countries (France, USA, Korea)
	        	let display = false ;
	        	if ( this.is_age_specific == false && d.type == 0 && d.highlight ){
	        		display = true ;
	        	}

	        	// Only add to legends if highlighted
	        	if ( item && item.highlight ) {
		        	this.sorted_legends.push({
		        		id : `line-${d.type}-${d.id}`,
		        		label : item.label ,
		        		type : d.type ,
		        		color : d.color ,
		        		period : d.period ,
		        		pos_start : pos_start ,
		        		pos_end : text_pos ,
		        		display : display ,
		        		highlight : true
		        	}) ;
		        }
	        })

	        if ( this.is_age_specific == true ){
		        this.legends_texts = Array.from( d3.group( this.sorted_legends , s => {
		        		return s.period
		        	}) ) 
		        	.map( d => {
		        		return { 
		        			key : d[0] , 
		        			label : ( this.is_age_specific == true ) ? d[1][0].period : legends_texts_domain[ d[0]] , 
		        			pos : d[1][0].pos_end , 
		        			color : d[1][0].color 
		        		} ; 
		        	})
		        ; 
		    }
		    else
		    {
		    	console.info("this.sorted_legends",this.sorted_legends) ;

		    	this.legends_texts = this.sorted_legends
		    		.map( m => {
			    		return {
		        			key 	: m.type ,
		        			label 	: ( (m.type == 0) ? m.label + ', ' : '') + legends_texts_domain[ m.type ] ,
		        			pos 	: m.pos_end ,
		        			color 	: m.color ,
		        			lastValue : m.pos_start.y // last ASR value for sorting
		        		} ;
			    	})
			    	.sort( (a, b) => b.lastValue - a.lastValue ) // sort by last value descending

		    	console.info("this.legends_texts",this.legends_texts) ;
		    }

	        //console.info("this.legends_texts",this.legends_texts) ; 

	        let legend_trans = this.legend_lines.selectAll('.line_legend')
	            .data( this.sorted_legends ) ;


	        legend_trans.enter()
	            .append('line')
	            .attr("stroke","#ccc")
	            .attr("stroke-width","2px")
	            .attr('stroke-dasharray',2)
	            .attr('class','line_legend')
	            .style("opacity",0) ; 

	        this.legend_lines.selectAll('.line_legend')
	        	.style("opacity",0)
	            .attr('x1',(d)=>{
	                return this.x_scale( d.pos_start.x ) ; 
	            })
	            .attr('y1',(d)=>{
	                return this.y_scale( d.pos_start.y ) ; 
	            })
	            .attr('x2',(d)=>{
	                return this.x_scale( d.pos_end.x ) ; 
	            })
	            .attr('y2',(d,i)=>{
	                return this.y_scale( d.pos_end.y ) ; 
	            }) 
	            .transition()
    			.delay(this.transition_duration)
	            .style("opacity",d => (d.display==true)?1:0)
	        ;

	        legend_trans
	            .exit()
	            .remove() ;

	        let selected_lines = [] ; 

	       
	        // console.info( this.dataset ) ; 
	        let texts = this.legend_lines.selectAll('.text_legend')
	            .data( this.legends_texts , d => d.label ) ; 

	        texts
	        	.enter()
	            .append('text')
	            .attr('class','text_legend')
	            .attr('text-anchor','left')
	            .attr('attr-id',(d)=>{ return d.id ; })
	            
	        ;

	        this.legend_lines.selectAll('.text_legend')
	            .transition()
	            .attr('x',(d)=>{
	                return this.x_scale( d.pos.x ) + 2 ; 
	            })
	            .attr('y',(d)=>{
	                return this.y_scale( d.pos.y ) ; 
	            })
	            .attr('fill',d=>{
	            	//return d.color ; 
	            	return ( this.is_age_specific == true || d.key == 0 ) ? d.color: '#000'
	            })
	            .transition()
    			.delay(this.transition_duration)
	            .text( d => d.label )

	        texts
	            .exit()
	            .remove() ; 

	        return ; 
	    }

	}

}

</script>

<style lang="scss">
// Base spacing unit: 8px
$space-xs: 4px;
$space-sm: 8px;
$space-md: 16px;
$space-lg: 24px;
$space-xl: 32px;

// Left alignment matches SVG left margin
$align-left: 70px;

.container {
	max-width: 100% !important;
	padding: 0;
	height: 100vh;
	overflow: hidden;
}

#model1 {
	height: 100vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

// HEADER
.page-header {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $space-lg;
	padding: $space-lg $space-xl;
	border-bottom: 1px solid #eee;
	flex-shrink: 0;

	h1 {
		padding: 0;
		margin: 0;
		font-size: 1.8em;
		text-align: center;
		font-weight: 700;
		line-height: 1.3;
	}
}

// CONTENT ROW
.content-row {
	flex: 1;
	display: flex;
	align-items: stretch;
	min-height: 0;
	overflow: hidden;
}

.graphic-col {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: $space-lg $space-xl;
	min-width: 0;
}

.legend-col {
	width: 180px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	padding: $space-sm $space-md;
	border-left: 1px solid #eee;
}

#graphic {
	flex: 1;
	display: flex;
	align-items: flex-start;
	justify-content: flex-start;
	position: relative;
	min-height: 0;
}

.source {
	display: flex;
	align-items: center;
	gap: $space-md;
	padding: $space-md 0 $space-lg 0;
	font-size: 0.85em;
	color: #666;
	flex-shrink: 0;
	text-align: right ; 
	width: 100% ; 
	padding: 20px 60px ;
	z-index: 999 ; 
	.source-logo {
		height: 32px;
		width: auto;
	}

	a {
		color: #0066cc;
		text-decoration: none;
		padding: 2px 4px;
		border-radius: 2px;
		transition: background-color 0.2s ease;

		&:hover {
			background-color: rgba(0, 102, 204, 0.1);
			text-decoration: none;
		}
	}
}

// Sex toggle buttons - same height as legend buttons
.sex-toggle {
	display: flex;
	gap: 2px;

	.btn-toggle {
		padding: $space-xs $space-sm;
		border: none;
		background: #ccc;
		color: #333;
		cursor: pointer;
		font-weight: 700;
		font-size: 0.85em;
		transition: all 0.2s ease-in-out;
		border-radius: 3px;
		line-height: 16px;
		&:hover {
			background: #bbb;
		}

		&.active {
			background: #333;
			color: #fff;
		}
	}
}

// Sidebar legend
.filters {
	height: 100%;
	display: flex;
	flex-direction: column;

	form {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.row {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
}

.legend-title {
	padding: $space-sm $space-md;
	margin: $space-sm 0 $space-xs 0;
	font-size: 0.8em;
	color: #666;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

a.link_step {
	display: block;
	font-size: 0.85em;
	padding: 0;
	transition: all 0.2s ease-in-out;
	text-decoration: none;

	&:hover {
		opacity: 0.85;
		text-decoration: none;
	}

	span.step_marker {
		transition: all 0.2s ease-in-out;
		padding: $space-xs $space-sm;
		display: block;
		text-align: left;
		font-weight: 700;
		font-size: 0.85em;
		border-radius: 3px;
		margin-bottom: 2px;

		i {
			margin-right: $space-xs;
		}
	}

	span.step_marker_white {
		color: #fff;
	}

	label {
		display: block;
		width: 100%;
		cursor: pointer;
	}

	input[type="checkbox"] {
		display: none;
	}

	input[type="checkbox"]:not(:checked) + span i {
		display: none;
	}

	input[type="checkbox"]:checked + span i {
		display: inline-block;
	}
}

.step1, .step2 {
	margin: 0;
	padding: 0;
}

.flex-spacer {
	flex: 1;
	min-height: $space-md;
}

.korea-section {
	margin-top: auto;
	padding-bottom: $space-sm;
}

g.x.axis, g.y.axis {
	.tick text {
		font-size: 12px;
		font-weight: 500;
	}
}

g.y.axis {
	.tick line {
		stroke: #eee;
	}
}

text.text_legend {
	font-size: 16px;
	font-weight: 600;
	text-shadow: none;
}

</style>