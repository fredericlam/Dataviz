<template>

	<div class="container">
		
		<div class="model" id="model1">
			<div class="row">

				<div class="col">

					<h1>ASR (World), Incidence, Mortality, Prostate Cancer <span id="year">{{ year }}</span></h1>

					<div id="graphic"></div>

					<input type="button" value="Animate" v-on:click="redraw([0,1])"/> 

					<div class="source"> 
						Source: 2023/09 -<a href="https://gco.iarc.who.int">GCO</a> - <a href="https://gco.iarc.fr/today">Globocan {{ year }}</a> - Ferlay J, Ervik M, Lam F, Colombet M, Mery L, Piñeros M, Znaor A, Soerjomataram I, Bray F (2020). Global Cancer Observatory: Cancer Today. Lyon, France: International Agency for Research on Cancer. Available from: https://gco.iarc.fr/today, accessed [DD Month YYYY].
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
	name : 'ProstateCancer' , 
	components : { } , 
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
 	
 		const store = useStore()
	
		return {
  	
  	}
	},
	data() {
	    return {
	    	year : 2020 ,
	    	margin : {top: 20, right: 250, bottom: 80, left: 250 } , 
	    	conf_data : {} ,

	    	x_scale : [] , 
	    	x_axis : [] ,

	    	y_scale : [] , 
	    	y_axis : [] ,

	    	color_scale : {} , 
	    	colors : ["#0b80b7","#dc143c"] ,

	    	// options 
	    	scales : {
			    lin: "scaleLinear",
			    log: "scaleLog"
			}, 

			lines_dataset : [] , 
			legend_lines_accolades : [ ] , 

			all_values : [] , 
			dataset : [] ,

			stroke_width : 2 , 

			annotations : [] , 

			styles: {}
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
				.attr('xmlns',"http://www.w3.org/2000/svg")
				.attr('id','graphic')
	    	.attr("width", this.width )
	    	.attr("height", this.height )
	    	.attr("viewBox", [0, 0, this.width, this.height])
	    	//.attr("style", "max-width: 100%; height: auto;")

		    this.tooltip = d3.select('#graphic').append('div')
				.attr('class','tooltip_viz') 
				.style('opacity',0)
			; 


			this.defs = this.svg.append('defs')

			let markers = [
				{ id : 'startarrow' , points : '10 0, 10 7, 0 3.5' , fill : this.colors[0] },
				{ id : 'endarrow', points : '0 0, 10 3.5, 0 7', fill : this.colors[1] }
			] ; 

			markers = [
				{ id : 'arrow-inc' , viewBox : '0 0 10 10' , fill : this.colors[0] },
				{ id : 'arrow-mort' , viewBox : '0 0 10 10' , fill : this.colors[1] }
			] ; 

			let node_markers = this.defs.selectAll('.marker')
		    	.data( markers , d => d.id );

		  node_markers
		  	.enter()
		  	.append('marker')
		  	.attr('id',d => d.id)
		  	.attr('viewBox','0 0 10 10')
		  	.attr('markerWidth',5)
				.attr('markerHeight',5)
				.attr('refX',5)
				.attr('refY',5)
				.attr('orient','auto-start-reverse')
				.append('path')
				.attr('d','M 0 0 L 10 5 L 0 10 z') 
				.attr('fill',d => d.fill)
			; 

				/*.append('polygon')
				.attr('points',d => d.points)
				.attr('fill',d => d.fill)*/

	    // this.y_scale = d3.scaleLinear()
	  		//.range([this.margin.top, this.height - this.margin.bottom- this.margin.top]);

	  	this.svg.append("g")
		    .attr("class", "y axis")
		   	.attr("transform", `translate(${this.margin.left},0)`) 
		   	.attr("text-anchor","end")

			this.svg.append("g")
			  .attr("class", "x axis")
			  .attr("transform", `translate(0,${this.height-this.margin.bottom})`) 

			this.group_areas = this.svg.append('g')
		    .attr('class','group_areas')

			this.group_lines = this.svg.append('g')
		    .attr('class','group_lines')

	    this.svg.append("text")
	    	.attr('class','legendAxis')
	    	.attr("y",this.margin.left-100)
	    	.attr("x",-(this.height/2))
	    	.attr("transform","rotate(-90)")
	    	.text("Age-standardised rate per 100,000")

	    this.svg.append("text")
	    	.attr('class','legendAxis')
	    	.attr("x",(this.width/2)-this.margin.left+this.margin.right)
	    	.attr("y",this.height-20)
	    	.text("Year")

	   	// legend incidence mortality
	    let pos_y_legend = this.height-40 ; 

	    var ordinal = d3.scaleOrdinal()
			  .domain(["Incidence", "Mortality"])
			  .range( this.colors )
			;

			this.svg.append("g")
			  .attr("class", "legendColorLine")
			  .attr("transform", `translate(${this.width-200},${pos_y_legend})`);

			var legendSizeLine = d3.legendColor()
		      .scale(ordinal)
		      //.labelWrap(30)
		      .shape("rect")
		      .shapeWidth(100)
		      .shapeHeight(2)
		      //.labelAlign("middle")
		      .shapePadding(10);

			let promise = axios.get( "../data/Prostate_2023.json" ) ; 

			axios.all( [promise] )
				.then( axios.spread(( dataset_promise ) => {
					
					this.dataset = dataset_promise.data
					
					this.conf_data = {
						dataset : this.dataset , 
						x : [ d3.min(this.dataset,d=>d.year) , d3.max(this.dataset,d=>d.year) ] ,
						y : [ d3.min(this.dataset,d=>d.asir) , d3.max(this.dataset,d=>d.asir) ] ,
						// lines : d3.groups( this.dataset , d => d.country , d => d.type )
						lines : d3.nest().key( d => d.country ).key( d => d.type ).entries( this.dataset )
					} ; 

					let line , values = [] ; 


					/* this.conf_data.lines.forEach( line => {
						
						console.info({
							country : line[0],
							data : line[1]
						}) ;

					})
					
					// console.info("lines", this.conf_data.lines ) ; 
					return ;*/

					this.conf_data.lines.forEach( c => {
						
						// c.forEach( d3.v7 )
						c.values.forEach( t => {
							values = [] ; 

							//console.info( t ) ; 
							// t.forEach( d3.v7 )
							t.values.forEach( s => {
								let obj = { 
									id : `line-${s.type}-${s.country}`, 
									asir : s.asir , 
									year : s.year , 
									type : s.type , 
									country : s.country 
								} ;
								this.all_values.push(obj) ; 
								values.push(obj) ;

								line = {
									id : obj.id ,
									country : s.country , 
									type : s.type
								}
							})

							line.color = (line.type==0)?this.colors[0]:this.colors[1] ; 
							line.stroke_width = (line.type==0)?'1px':'1px' ; 
							line.opacity = (line.type==0)?'1':'0.5' ; 
							line.dash = ( line.type == 0 ) ? false : true ; 
							line.dash_width = 0 ;
							line.values = values ; 

							this.lines_dataset.push( line ) ; 
						});
					})

					// console.log("this.lines_dataset",this.lines_dataset) ; 
					this.redraw( [1] ) ; 
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

		setLegend : function( legends ){
	
		},

		/**
		* Redraw graphic
		* @param (bool) init or not
		* @return (no return )
		*/
		redraw : function( param_type ){

			this.annotations = [] ; 

			this.svg.selectAll('g.legend_lines').remove();

			this.legend_lines = this.svg.append('g')
        .attr('class','legend_lines') 
        .style('opacity',0)

			this.dataset.map( m => {
				m.sort = m.year  ; 
				return m ; 
			})

		 	this.x_scale = d3.scaleLinear()
		 		.domain( this.conf_data.x )
      	.range([ this.margin.left , this.width - this.margin.right ]) 
      	.nice()
      	// .paddingOuter(1)
      ;
	        
     	this.domains = d3.extent( this.dataset.filter( f => param_type.includes(f.type) ) , (d)=> {
        	return +d.asir ;
    	}); 

    	let y_min = 0 , y_max = this.domains[1] ;
    	
     	this.y_scale = d3.scaleLinear().range([this.height-this.margin.bottom,this.margin.top]) //

      this.y_scale.domain( [ y_min,y_max ] ).nice() ;

      this.y_axis = d3.axisLeft(this.y_scale)
        .ticks(10)
        .tickSize(-(this.width-this.margin.left-this.margin.right))
        .tickSizeOuter(10)
      ;

	    // double lines
	    this.legend_lines_accolades = [] ; 

	    if ( param_type.length > 0  )
	    {
	      param_type.forEach( t => {

	      	let min = d3.min(this.dataset.filter( f => f.type == t ),d=>d.asir) , 
	      	max = d3.max(this.dataset.filter( f => f.type == t ),d=>d.asir) , 
	      	mean = (max-min)/2 ; 

	      	// legend_lines
	      	let line = {
	      		id : `lin-accolade-${t}` ,
	      		min : min , 
	      		max : max , 
	      		mean : mean , 
	      		type : t , 
	      		color : this.colors[t], 
	      		threshold : ( t == 1 ) ? 20 : 5 
	      	};

	      	this.legend_lines_accolades.push(line) ; 

	      	this.annotations.push(
					  {
					    note : { 
					    	title: "" , label : ( t == 0 ) ? 'Range of incidence   ' : 'Range of mortality   '
					    },
					    x : this.width-this.margin.right+line.threshold ,
					    y : this.y_scale( mean ) ,
					    dy : ( t == 0 ) ? -50 : -3 ,
					    dx :( t == 0 ) ? 20 : 30 ,
					    type : d3.annotationCalloutCircle ,
					    /*connector : { 
					    	end: "dot",
		            type: "curve" 
		          },*/
		          disable: ["connector"], // doesn't draw the connector
					    subject: {
						   radius: 0 ,
						   radiusPadding: 0
							},
							color : this.colors[t]
					  }
					) ;

	      })

        // console.info("annotations",this.annotations) ; 
      }
		
      this.x_axis = d3.axisBottom(this.x_scale)
      	//.ticks(10)
      	.tickFormat(d=>{
      		return d
      	})

      this.transition_duration = 7000 ; // 7000 ; 

      d3.transition(this.svg).select(".y.axis")
          .transition()
          .duration(this.transition_duration)
          .call(this.y_axis);

      d3.transition(this.svg).select(".x.axis")
          .transition()
          .duration(this.transition_duration)
          .call(this.x_axis);

      this.area = d3.area()
          .x((d, i) =>{ return this.x_scale( d.year_max ); })
          .y0((d, i) =>{ return this.y_scale( d.pl ); })
          .y1((d, i) =>{ return this.y_scale( d.asir ); })
          .curve( d3.curveLinear );

      let areas = this.lines_dataset.filter( f => param_type.includes( f.type ) )
      	.map( a => {
      		a.values.map( v => {
      			v.pl = ( v.type == 1 ) ? 10 : 50 ; 
      			v.year_max = v.year ; 
      			return v ; 
      		})
      		return a; 
      	}) 

      if ( param_type.length > 1)
      {
      	// console.log("this.lines_dataset",this.lines_dataset) ; 
      	let all_years = this.lines_dataset[19].values.map( y => y.year ) , max_per_years = [] ; 
      	all_years.map( y =>{
      		let all_per_year = [] ; 
      		this.lines_dataset.forEach( l => {
      			let row = l.values.find( f => f.year == y ) ; 
      			if ( row != undefined ) all_per_year.push( row.asir )  ; 
      		})
      		// console.info(" => " , y , all_per_year) ; 
      		max_per_years.push({ year : y , max_asir : d3.max(all_per_year) + 10 });
      		return y ; 
      	})

      	// console.log("max_per_years",max_per_years) ; 

	      let areas_base = [{
	      	color: this.colors[0] ,
					type : 'Incidence',
					id: "area-incidence",
					values : this.lines_dataset[19].values.map( d => {
						let row =  max_per_years.find( y => y.year == d.year ) ; 
						let max_asir = 0 ; 
						if ( row != undefined ) max_asir = row.max_asir ; 
						return { 
							pl : 20 , 
							year_max : ( d.year < 2017 ) ? d.year : 2017 , 
							asir : max_asir
						}
					}),
					opacity : 0.6 
	      },{
	      	color: this.colors[1] ,
					type : 'Mortality',
					id: "area-mortality",
					values : this.lines_dataset[19].values.map( d => {
						return { pl : 10 , year_max : d.year , asir : 48 }
					}),
					opacity : 0.4
	      }]

	      areas = areas_base ; 

	      console.info("areas",areas) ; 

	      this.g_areas = this.group_areas.selectAll(".area")
	        .data( areas , d => 'area_'+d.id ) ;

	      this.g_areas
	        .exit()
	        .remove()

	      this.g_areas
		      .enter()
		      .append("path")
		      .attr('class','area')
		      .attr("id",d=>d.id)
		      .attr("d", (d) => this.area(d.values)  )
		      .style("fill", (d) => d.color )
		      .style("opacity",d=>d.opacity)
	      ;
	    }

      this.line = d3.line()
        .x((d)=>{ return this.x_scale( d.year ); })
        .y((d)=>{ return this.y_scale( d.asir ); })
        .curve( d3.curveBasis )
      ;

      this.lines = this.group_lines.selectAll('.path_lines_d')
        	.data( this.lines_dataset.filter( f => param_type.includes( f.type ) ) , d => d.id );

      let lines_tran = this.lines
        .enter()
        .append("path")
        .attr('class','path_lines_d')
        .attr('id',d => d.id )
        .attr("d",d => this.line(d.values) )
        .attr("stroke",d => d.color )
        .style("stroke-width", d => d.stroke_width ) // this.stroke_width )
        .style("opacity", d => d.opacity )
        .attr('stroke-dasharray',0)
        .attr("fill", "none") 
      ;
		       	
      lines_tran.call(line_transition, this.transition_duration ); 

      this.lines
          .transition()
          .duration( this.transition_duration )
          .attr("d", d => this.line(d.values) )

      this.lines
          .exit()
          .remove() ; 

      


     	this.lines_accolades = this.legend_lines.selectAll('.line_accolade')
        	.data( this.legend_lines_accolades , d => d.id );

      let lines_accolades = this.lines_accolades
      	.enter()
      	.append('line')
      	.attr('x1',d => this.width-this.margin.right+d.threshold)
      	.attr('x2',d => this.width-this.margin.right+d.threshold)
    		.attr('class','line_accolade')
    		.attr('id',d => d.id)
    		.attr('marker-start', d => (d.type == 0)?'url(#arrow-inc)':'url(#arrow-mort)')
    		.attr('marker-end', d => (d.type == 0)?'url(#arrow-inc)':'url(#arrow-mort)')
     	
      lines_accolades
        .transition()
      	.delay(this.transition_duration)
      	.attr('x1',d => this.width-this.margin.right+d.threshold)
      	.attr('y1',d => this.y_scale(d.min))
      	.attr('x2',d => this.width-this.margin.right+d.threshold)
      	.attr('y2',d => this.y_scale(d.max))
      	.attr("stroke",(d,i)=>d.color)
      	.attr("stroke-width", 1 )

     	lines_accolades
          .exit()
          .remove() ; 



      setTimeout(() => {
      	// Todo...
      
	      let makeAnnotations = d3.annotation().annotations( this.annotations );

				this.g_annotations = this.legend_lines
			  	.append("g")
			  	.attr("class", "annotation-group")
			  	/*.transition()
				  .duration(0)
				  .delay(this.transition_duration)*/
			  	.call( makeAnnotations )

			  this.legend_lines.style('opacity',1)

			}, this.transition_duration )

    }
	
	} // end redraw

}

</script>

<style lang="scss">

:root {
  color-scheme: light dark; /* both supported */
}

body {
  background: #fff;
  font: 100% system-ui;
}

h1,
p {
  color: #222;
}

body.dark-theme {
  background: #121212;
  color: #fff ; 
}

h1{
	padding: 20px 0 10px 40px;
	font-size: 1.4em;
	text-align: center ;
	font-weight: 900;
	text-transform: uppercase; 
}

.model{
	padding-bottom: 100px ;
	
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

g.legend_lines{
	line{
		stroke-width: 4px!important;
	}
	text{
		font-size: 18px;
		font-weight: 500;
	}
}

.source{
	padding: 0 50px 20px 60px;
	font-size: .8em; 
}

</style>
