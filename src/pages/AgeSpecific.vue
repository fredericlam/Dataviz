<template>

	<div class="container">
		
		<div class="model" id="model1">
			<div class="row">

				<div class="col-md-2">

					<div class="filters">
						<form>
							
							<!--<div class="mb-3">
								<label class="form-label">Sort by level of education</label>
								<select id="sort_by" v-model="sort_by" placeholder="Sort by" class="form-select" v-on:change="redraw">
									<option v-for="f in filters.educations" :value="f.edu">{{ f.edu }}</option>
								</select>
							</div>

							<div class="mb-3">
								<label class="form-label">Sort direction</label>
								<select id="sort_dir" v-model="sort_dir" placeholder="Sort direction" class="form-select" v-on:change="redraw">
									<option value="asc">Ascending</option>
									<option value="desc">Descending</option>
								</select>
							</div>-->

						</form>

						<!--<ul class="list-group" id="countries_list">
							<li class="list-group-item" v-for="population in filters.populations_ordered">
								<a href="javascript:void(0)" class="country_button" v-on:mouseover="selectCountry(population.label)"  v-on:mouseout="deselectCountry()">
									<img :src="'../img/flags/'+population.iso+'.svg'">
									{{ population.label }}	
								</a>
							</li>
						</ul>-->

					</div>

				</div>

				<div class="col-md-10">

					<h1>Age-standardized rate (World) per 100 000, incidence and mortality, females</h1>

					<div class="story">
						<div class="row">

							<div class="col-md-3">
								<p class="step1">
									<a href="#" class="link_step" v-on:click="startAnimation(['Higher'])" >
										<span class="step_marker" :style="{ 'background-color': pops[0].color }">France </span>
									</a>
								</p>
							</div>

							<div class="col-md-3">
								<p class="step2">
									<a href="#" class="link_step" v-on:click="startAnimation(['Intermediate'])" >
									<span class="step_marker step_marker_white" :style="{ 'background-color': pops[2].color }">USA</span>
									</a>
								</p>
							</div>

							<div class="col-md-3">
								<p class="step2">
									<a href="#" class="link_step" v-on:click="startAnimation(['Lower'])" >
									<span class="step_marker step_marker_white"  :style="{ 'background-color': pops[1].color }">Republic of Korea</span>
									</a>
								</p>
							</div>
							<div class="col-md-3">
								<button type="button" class="btn btn-primary mb-3" id="btn-reset" v-on:click="resetAll">
									Reset all
								</button>
							</div>
								
						</div>
					</div>

					<div id="graphic"></div>

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
	name : 'Cervix' , 
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
	    	margin : {top: 10, right: 40, bottom: 80, left: 40} ,

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

			axis : {
				x : [ 1955 , 1965 , 1975 , 1985 , 1995 , 2005 , 2015 ]
			},
			pops : [
				{ country : 25000 , label : 'France' , color : "#ffbc42" } ,
				{ country : 84000 , label : 'USA' , color : "#d81159" } ,
				{ country : 41000 , label : 'Korea' , color : "#218380" }
			]
	    }
	},
	created(){	
	},
	mounted(){

		this.width = $('#graphic').width() ; 
		this.height = ( $(window).height() < 600 ) ? $(window).height() - 80 : 600 ; 
		
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

		this.chartState.measure = this.count.total ;
		this.chartState.scale 	= this.scales.lin ;
		this.chartState.legend 	= this.legend.total ;

		let promise = axios.get( "../data/dataset-thyroid.json" ) ; 

		axios.all( [promise] )
			.then( axios.spread(( dataset_promise ) => {

				let tmp_dataset = dataset_promise.data.dataset.map( d => {
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

				// console.info("tmp_dataset",tmp_dataset) ; 

				let lines_dataset =  d3.group(tmp_dataset, d => d.country , d => d.type ) ;
				let line , values = [] ; 

				lines_dataset.forEach( c => {
					
					
					c.forEach( t => {
						values = [] ; 

						//console.info( t ) ; 

						t.forEach( s => {
							let obj = { asr : s.asr , year : s.year , country : s.country } ;
							this.all_values.push(obj) ; 
							values.push(obj) ;
							line = {
								id : s.id ,
								country : s.country , 
								type : s.type , 
								sex : s.sex
							}
						})

						let country = this.pops.find( p => line.country == p.country )

						line.color = country.color ; 
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
				

				this.redraw( true );
				
			}))
	        
	        // eslint-disable-next-line
	        .catch( error => {
	            console.error("Error catched",error) ; 
	            this.error = true
	        })
	        .finally(() => {
	        
	        })

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
	            .duration(500)
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
		redraw : function( init ){

			// legend
			
		 	this.x_scale = d3.scaleBand()
			 	// .domain( this.filters.years.map( p => p.year ) )
			 	.domain( this.axis.x )
	        	.rangeRound([ this.margin.left , this.width - this.margin.right ]) 
	        	//.paddingInner(1)
	        ;
	        	

			// Set scale type based on button clicked
	        if (this.chartState.scale === this.scales.lin) {
	            this.y_scale = d3.scaleLinear().range([this.height-this.margin.bottom,this.margin.top]) //.range([ this.margin.top , this.height - this.margin.bottom ])
	        }

	        if (this.chartState.scale === this.scales.log) {
	            //this.y_scale = d3.scaleLog().range([0,this.height]) //.range([ this.margin.top, this.height - this.margin.bottom ]);
	        }

	        this.domains = d3.extent(this.all_values, (d)=> {
            	return +d.asr ;
        	}); 
        	

	        this.y_scale.domain([0,this.domains[1]] ).nice() ;

	       	//console.log("this.filters.populations.map( p => p.iso )",this.filters.populations.map( p => p.iso )) ;

	        // Set X axis based on new scale. If chart is set to "per capita" use numbers with one decimal point

            this.y_axis = d3.axisLeft(this.y_scale)
                .ticks(10)
                .tickSize(-(this.width-this.margin.left-this.margin.right))
                .tickSizeOuter(1)

            ;

            this.x_axis = d3.axisBottom(this.x_scale)
            	.ticks(10)
            	//.tickFormat("")
	        // console.info("this.x_scale",this.x_scale)

	        d3.transition(this.svg).select(".y.axis")
	            .transition()
	            .duration(750)
	            .call(this.y_axis);

	        d3.transition(this.svg).select(".x.axis")
	            .transition()
	            .duration(750)
	            .call(this.x_axis);

	    } // end redraw

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

.filters{
	padding-top: 20px;
	.legend{
		padding-left:0 ;
	}
}


</style>