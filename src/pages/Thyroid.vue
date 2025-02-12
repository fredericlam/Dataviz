<template>

	<div class="container">
		
		<div class="model" id="model1">

			<div class="row">

				<div class="col-md-9">

					<h1 v-if="is_age_specific==false">Age-standardized rate (World) per 100 000<br/> incidence & mortality , females</h1>
			<h1 v-if="is_age_specific==true">Rates per 100 000 by period, Age-specific<br/> Korea (5 registries), incidence , females</h1>

					<div id="graphic"></div>

					<div class="source">
						<span v-if="is_age_specific==false"><strong><u>Data source</u></strong>: <a href="https://gco.iarc.fr" target="_blank">The Global Cancer Observatory</a>, <a href="https://gco.iarc.fr/overtime" target="_blank">Cancer Overtime</a> </span>
						<span v-if="is_age_specific==true"><strong><u>Data source</u></strong>: <a href="https://ci5.iarc.fr/ci5plus" target="_blank">CI5PLUS: Cancer Incidence in Five Continents Time Trends</a></span>
					</div>

				</div>

				<div class="col-md-3">

					<div class="filters" style="margin-top: 60px;">
						<form>
							
							<div class="row" v-if="is_age_specific==false">
								
								<div class="col-md-12">
									<p class="step1">
										<a href="#" class="link_step">
											<span class="step_marker" :style="{ 'background-color': pops[0].color }">
												<i class='fas fa-check'></i>
											France 
											</span>
										</a>
									</p>
								</div>

								<div class="col-md-12">
									<p class="step2">
										<a href="#" class="link_step">
										<span class="step_marker step_marker_white" :style="{ 'background-color': pops[1].color }">
											<i class='fas fa-check'></i>USA</span>
										</a>
									</p>
								</div>

								<div class="col-md-12">
									<p class="step2">
										<a href="#" class="link_step">
										<span class="step_marker step_marker_white" :style="{ 'background-color': pops[2].color }">
											<i class='fas fa-check'></i>Italy</span>
										</a>
									</p>
								</div>

								<div class="col-md-12" style="margin-top: 200px">
									<p class="step2">
										<a href="#" class="link_step" v-on:click="startAnimation()" >
											<span class="step_marker step_marker_white"  :style="{ 'background-color': pops[3].color }">
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

			</div><!-- end row -->

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
	    	margin : {top: 10, right: 200, bottom: 80, left: 40} ,

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

			chartState : {} , 

			filters : {} , 

			sort_by : 'Lower',
			sort_dir : 'asc' , 

			steps : []  ,

			animate : false ,

			axis : {
				x : [ 1943 , 2020 ]
			},
			pops : [
				{ country : 250 , label : 'France' , color : "#ffbc42" } ,
				{ country : 840 , label : 'USA' , color : "#d81159" } ,
				{ country : 380 , label : 'Italy' , color : "#287afb" } ,
				{ country : 410 , label : 'Korea' , color : "#218380" }
			] , 

			target_country : 410 , 

			is_age_specific : false , 

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

			this.width = $('#graphic').width() ; 
			this.height = ( $(window).height() < 600 ) ? $(window).height() - 80 : 600 ; 

			this.width = this.height + 250 ; 
			
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



			let promise = axios.get( "../data/dataset-thyroid-v2.json" ) ; 

			if ( this.is_age_specific == true ){
				promise = axios.get( "../data/dataset-age-specific.json" ) ; 
			}

			axios.all( [promise] )
				.then( axios.spread(( dataset_promise ) => {

					console.info( "dataset_promise" , dataset_promise.data )

					let tmp_dataset = [] , key_  ; 


					if ( this.is_age_specific == true )
					{
						key_ = 'period' ; 
						tmp_dataset = dataset_promise.data
							.map( d => {
								let m = d.age.split('-') ;
								return {
									id : `plot-${d.age}-period-${d.period}` , 
									period : d.period , 
									type : 0 ,
									age : d.age ,
									y : parseFloat(m[0])  ,
									asr : parseFloat(d.rate)
								}
							}) ;
					}
					else
					{
						key_ = 'country' ; 
						tmp_dataset = dataset_promise.data.dataset
							//.filter( f => f.type == 0 )
							.map( d => {
								return {
									id : `dot-${d.id}-${d.type}-${d.sex}` , 
									//iso : d.country_iso2 , 
									country : d.country , 
									year : d.year , 
									sex : d.sex , 
									type : d.type ,
									asr : parseFloat(d.asr)
								}
							}) ;
					}

					// console.info("tmp_dataset",tmp_dataset) ; 

					let lines_dataset =  d3.group(tmp_dataset, d => d[key_] , d => d.type ) ;
					let line , values = [] ; 

					// console.info("lines_dataset",lines_dataset) ; 

					lines_dataset.forEach( c => {
						
						
						c.forEach( t => {
							values = [] ; 

							//console.info( t ) ; 

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

							line.color = item.color ; 
							line.dash = ( line.type == 0 ) ? false : true ; 
							line.values = values ; 

							this.dataset.push( line ) ; 
						});

						//line.values = values ; 
						//
					})

					// console.info("this.dataset",this.dataset,this.all_values) ; 
					// console.table(this.dataset) ; 
					this.filters.years = Array.from( d3.group( this.all_values , d => d.year ) )
						.map( m =>{ 
							return { year : m[0] } 
						})

					console.info("this.filters.years",this.filters.years) ; 

					this.filters.colors = [] ; 	
					
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

	    },250)
	},

	unmounted(){

	},

	methods : {

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

			if ( this.animate == true ){
				dataset_in = this.dataset ;
				all_values_in = this.all_values ; 
			} else {

				if ( this.is_age_specific == true ){

					dataset_in = this.dataset
						.filter( c => {
							return this.lines_checkbox.includes( c.period ) 
						})

					all_values_in = this.all_values
				
				}
				else{
					dataset_in = this.dataset.filter( c => c.country != this.target_country )
					all_values_in = this.all_values.filter( c => c.country != this.target_country )
				}
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

	        	let last_pos = d.values[d.values.length-1] , text_pos , pos_start , row_txt , item = { 'label' : 'undefined' } ; 

	        	if ( this.is_age_specific == true ){
	        		if ( d.period != "1999-2000"){
	        			last_pos = d.values.find( d => d.y == 50 ) ;
	        		}
	        		text_pos =  {x:95,y:last_pos.asr} ; 
	        		pos_start = {x:last_pos.y,y:last_pos.asr}  ; 
	        	} else {
	        		item = this.pops.find( p => d.country == p.country )
	        		let is_targeted = dataset_in.find( c => c.country == this.target_country )
	        		let y_end = last_pos.asr + ( ( is_targeted != undefined && d.country == 84000 ) ? 5 : 0 ) ; //( is_targeted != undefined ) ? 60 : 16 ; 
	        		text_pos = (d.type == 1 ) ? {y:0.5,x:2021} : {y:y_end,x:2021} ; 
	        		pos_start = {x:last_pos.year,y:last_pos.asr}  ; 
	        	}

	        	let display = false ; 

	        	if ( this.is_age_specific == false && d.type == 0 ){
	        		display = true ; 
	        	}

	        	this.sorted_legends.push({
	        		id : `line-${d.type}-${d.id}`,
	        		label : item.label ,
	        		type : d.type ,
	        		color : d.color ,
	        		period : d.period ,
	        		pos_start : pos_start , 
	        		pos_end : text_pos ,
	        		display : display
	        	}) ;	        	
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

		    	this.legends_texts = this.sorted_legends.map( m => {
		    		return { 
	        			key 	: m.type , 
	        			label 	: ( (m.type == 0) ? m.label + ', ' : '') + legends_texts_domain[ m.type ] , 
	        			pos 	: m.pos_end , 
	        			color 	: m.color 
	        		} ; 
		    	})

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
h1{
	padding: 20px 0 10px 40px;
	font-size: 1.4em;
	text-align: left ;
	font-weight: 900;
	text-transform: uppercase; 
}

a.link_step{
	display: inline-block ; 
	font-size: 1em;
	padding: 0 5px 0 5px;
	height: 100%;
	min-width: 250px;
	transition: all 0.2s ease-in-out;
	&.span_white{
		color: #fff !important;
	}
	&:hover{
		background: #f0f0f0 ; 
		text-decoration: none!important;
	}
	span.step_marker{
		transition: all 0.2s ease-in-out;
		padding: 10px 0px 10px 30px; 
		display: block;
		margin: auto ; 
		text-align: left;
		font-weight: 800;
		i{
			margin-right: 5px;
		}
	}
	span.step_marker_white{
		color: #fff ; 
	}

	label{
		display: block; 
		width: 100%;
		cursor: pointer;
	}

	input[type="checkbox"]{
		display: none ; 
	}

	input[type="checkbox"]:not(:checked) + span i{
		display: none;
	}

	input[type="checkbox"]:checked + span i{
		display: inline-block ;
	}
}
button#btn-reset{
	float: right;
 		margin-right: 40px;
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
			font-size: 1.2em;
		}
	}
}

g.y.axis{
	.tick{
		line{
			stroke: #ccc ;
		}
	}
}

text.text_legend{
	text-shadow: 1px 1px rgb(0 0 0 / 55%);
}

.filters{
	padding-top: 20px;
	.legend{
		padding-left:0 ;
	}
}


</style>