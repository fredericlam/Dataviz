<template>

	<div class="container">
		
		<div class="model" id="model1">

			<div class="row">

				<div class="col-md-12">

					<h1>Economic and societal impact of cancer <span class="min">(in billion US $)</span></h1>
					
					<div id="graphic">
						<div class="row">
							<div class="col" v-for="(data,i) in dataset"><!-- .filter( d => d.is_total == false ) -->
								<div :class="['block','block-'+i]">
									<i v-if="data.icon" :class="['fas',data.icon]"></i>
									<h2 v-html="data.label"></h2>
									<div class="svg-container" :id="'svg-'+i">

									</div>
									<h3>
										<span class="cost" :style="{ fontSize : data.fontSize }">{{ data.cost}}</span>
										<span class="unit">billion US$ {{ data.extra }} </span>
									</h3>
								</div>
							</div>
						</div>
					</div>

					<p>
						<span>Data source: <a href="https://gco.iarc.fr" target="_blank">The Global Cancer Observatory</a>, <a href="https://gco.iarc.fr/overtime" target="_blank">Cancer Overtime</a> </span>
					</p>

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
	name : 'Cost' , 
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
	    	dataset : [
	    		{ label : 'Medical care' , cost : 490 , is_total : false , icon : 'fa-briefcase-medical' , fontSize : '3em'} , 
	    		{ label : 'Productivity loss mortality' , cost : 240 , icon : 'fa-hospital', is_total : false , fontSize : '2em'} , 
	    		{ label : 'Productivity loss morbidity' , cost : 98 , icon : 'fa-briefcase', is_total : false , fontSize : '1em'} , 
	    		{ label : 'Informal care' , cost : 96 , is_total : false , icon : 'fa-hands-helping' , fontSize : '1em'  } , 
	    		{ label : 'Total cost' , cost : 922 , is_total : true , icon : 'fa-dollar-sign' , fontSize : '4em' , extra : ' - 1.15% GDP' }
	    	]
	    }
	},
	created(){	
	},
	mounted(){

		this.dataset.forEach( (b,i) => {

			let w = 290 , h = 290 ; 
			let svg = d3.select(`#svg-${i}`).append('svg')
				.attr('id','svg-el-'+i)
				.attr('width',w)
				.attr('height',h) ; 

			let scale = this.x_scale = d3.scaleLinear()
				//.domain( [0,1000] ) //
				.domain( [0,1900] ) //
				.range([0,w])


			svg.append('circle')
				.attr('r',scale(b.cost))
				.attr('cx',w/2)
				.attr('cy',h/2)
				.attr('fill','#2B3356') // #fff
		})

	},

	unmounted(){

	},

	methods : {

	}

}

</script>

<style lang="scss">
/*body{
	background: #2B3356 ; 
	color: #fff ; 
}*/
h1{
	padding: 40px 0 100px 40px;
	font-size: 2.4em;
	text-align: center ;
	font-weight: 900;
	color: #000 ; 
	text-transform: uppercase; 
	span.min{
		text-transform: none ; 
	}
}

.block{
	min-height: 600px ; 
	border-right: solid 1px #ccc ; 
	position: relative ; 
	&:last-child{ 
	
	}

	&.block-3{
		border:block ;
	}
	&.block-4{
		border:none ;
	}
	i{
		display: block ;
		margin: auto ; 
		text-align: center ;  
		font-size: 3em;
		color: #728CB8 ; 
	}
	h2{
		color: #000 ; 
		margin-left: 0px;
		font-size: 1em;
		font-weight: 500 ; 
		text-align: center ; 
		width: 100% ; 
		padding: 20px 50px ;
		height: 80px;
	}
	h3{
		position: absolute ; 
		bottom: 0 ; 
		width: 100%; 
		text-align: center ; 
		font-weight: 900 ; 
		color: #B05A3F; 
		span{
			display: block;
			width: 100%;
			&.cost{
				font-size: 2.8em;
			}
			&.unit{
				font-size: .6em;
			}	
		}
	}
	svg{
		display: block; 
		margin: auto ; 
	}

}

#graphic{
	position: relative ; 
	width: 100%;
	min-height: 800px ; 
}


</style>