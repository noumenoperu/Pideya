import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Params } from '@angular/router';
import { Storage } from '@ionic/storage';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';
import { Plugins } from '@capacitor/core';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';
import { AlertController } from '@ionic/angular';
const { Geolocation } = Plugins;

declare var google;

@Component({
  selector: 'app-comprar',
  templateUrl: './comprar.page.html',
  styleUrls: ['./comprar.page.scss'],
})

export class ComprarPage implements OnInit {
  @ViewChild('map',  {static: false}) mapElement: ElementRef;
  searchData = null; 
  productos:any = [];
  tienda:any = {};
  myId = null;
  coords: any;
  myUbicacion: any;
  userID = null;
  comprar:any;
  user:any = {};
  precio = 0.00;
  cart_data:any = {}
  estimatedMinutes = {};
  celular:any;
  map: any;
  address:string;
  lat: string;
  long: string;
  latitud;
  longitud;
  marker:any;

  constructor(
    public http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private storage: Storage,
    private router: Router,
    public toastController: ToastController,
    private apiService: ApiService,
    private nativeGeocoder: NativeGeocoder,
    public alertController: AlertController
  ) { 


  }
  tarifaBase = null;
  precioXkm = null;
  calcXkm = null;
  subtotal = null;

  ngOnInit() {
    this.userID = localStorage.getItem('userId');
    this.storage.get('SET_CART').then( (res:any) =>{
      console.log('show_cart:....', res);
      this.locate(res)
      this.cart_data = res;
      /*
      this.cart_data = res;
      console.log('details cart', res.productoId);
      
      this.http.get(this.apiService.apiUrl +'producto/'+res.productoId).subscribe((data:any)=>{
        console.log('details producto', data.negocio.telefono);
        this.celular = data.negocio.telefono;
      })

      */
    })
  }

  async precioTatal(lat, long){
    

    
  }

  backpage(){
    this.router.navigate(['/tabs/tab1'])
  }
  detailsGoogleMaps(response, status){
    let minutos = response.rows[0].elements[0].duration.text;
    //alert(minutos)
  }

  calcDistance(p1, p2) {
    return (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000).toFixed(2);
  }

  statusDelivery = false;
  statusTienda = false;

  delivery(event){
    this.statusDelivery = false;
    this.statusTienda = true;
  }

  recojoTienda(event){
    this.statusTienda = true;
    this.statusDelivery = true;
  }


  localizador(ubicacion){
    this.myUbicacion = ubicacion.subLocality;

  }

  async locate(inputTxt) {
    //Optenemos coordenadas 
    const coordinates = await Geolocation.getCurrentPosition();
    this.coords = coordinates.coords;
    let options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5
    };
    
    let latLng = new google.maps.LatLng(coordinates.coords.latitude, coordinates.coords.longitude);
    let mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': latLng }, (results, status) => {
      console.log(results);
      this.myUbicacion = results[0].formatted_address;
      this.latitud = coordinates.coords.latitude;
      this.longitud = coordinates.coords.latitude;
    });

    this.tarifaBase = 3.5;
    this.precioXkm = 0.9;

    this.precio = 0.00
    //this.precio = (parseFloat(this.cart_data.total) + parseFloat(this.precioDelivery)).toFixed(2);
    console.log('carrito--------->',inputTxt)
    inputTxt.forEach(element => {
      var destino = new google.maps.LatLng(element.lat, element.long);
      var origen = new google.maps.LatLng(coordinates.coords.latitude, coordinates.coords.longitude);
      this.calcXkm = this.calcDistance(destino, origen);

      this.precioDelivery =  (( this.calcXkm * this.precioXkm) + this.tarifaBase).toFixed(2);
      let precioProduct = parseFloat(element.total);
      var precioDeliveryFinal = parseFloat(this.precioDelivery);
      this.priceProduct += precioProduct;
      this.priceDelivery += parseFloat(this.precioDelivery);

      console.log('suma', typeof precioProduct)
      this.precio += (precioProduct + precioDeliveryFinal);
      console.log('resultado=>>>>>>', this.precio)
    });

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);  
    this.addMarker(latLng);
  }


  addMarker(location) {

    console.log('location =>', location);

    this.marker = new google.maps.Marker({
      position: location,
      map: this.map,

      draggable: true,
      animation: google.maps.Animation.DROP
    });

    google.maps.event.addListener(this.marker, 'dragend', () => {
      console.log(this.marker);
      this.getDragAddress(this.marker);
    });

  }
  precioDelivery;

  priceDelivery = 0.00;
  priceProduct = 0.00;
  getDragAddress(event) {
    this.priceDelivery = 0.00;
    this.priceProduct = 0.00;
    const geocoder = new google.maps.Geocoder();
    const location = new google.maps.LatLng(event.position.lat(), event.position.lng());
    geocoder.geocode({ 'location': location }, (results, status) => {
      console.log(results);
      this.myUbicacion = results[0].formatted_address;
      this.latitud = event.position.lat();
      this.longitud = event.position.lng();
    });


    this.tarifaBase = 3.5;
    this.precioXkm = 0.9;

    this.precio = 0.00
    //this.precio = (parseFloat(this.cart_data.total) + parseFloat(this.precioDelivery)).toFixed(2);

    this.cart_data.forEach(element => {

      var destino = new google.maps.LatLng(element.lat, element.long);
      var origen = new google.maps.LatLng(event.position.lat(), event.position.lng());
      this.calcXkm = this.calcDistance(destino, origen);

      this.precioDelivery =  (( this.calcXkm * this.precioXkm) + this.tarifaBase).toFixed(2);
      let precioProduct = parseFloat(element.total);
      var precioDeliveryFinal = parseFloat(this.precioDelivery);

      this.priceProduct += precioProduct;
      this.priceDelivery += parseFloat(this.precioDelivery);

      console.log('suma', typeof precioProduct)
      this.precio += (precioProduct + precioDeliveryFinal);
      console.log('resultado=>>>>>>', this.precio)
    });
  }


  userId = null;
  prodId = null;
  negocioId = null;
  direccion = null;
  ubicacion = null;
  metodo_p = null;
  recojo = null;
  producto_cart = null;


  async submitPago(){

    let carrito = this.cart_data;
    console.log(carrito)

    //return carrito;
    let params = {
      usuario_id: this.userID,
      producto: JSON.stringify(carrito),
      driver_id: 0,
      lat: this.user.lat,
      long: this.user.long,
      direccion: this.user.referencia,
      ubicacion: this.user.ubicacion,
      cantidad: carrito.length,
      subtotal: '',
      total: this.user.precio,
      status: 'pendiente',
      rejoco: this.user.tienda,
      metodo_pago: this.user.metodo,
    }
    //console.log(params);
    console.log(this.user.metodo+" / "+this.user.tienda+" / "+(this.user.precio)+" / "+this.user.ubicacion+" / "+this.user.referencia);

    if ( 
      this.user.metodo && 
      this.user.tienda && 
      this.user.ubicacion && 
      this.user.referencia
      ) {
      this.http.post(this.apiService.apiUrl+"toBuy", params).subscribe((res:any)=>{
        this.storage.remove('SET_CART')
          this.http.get(this.apiService.apiUrl+ "delete/cart/" + this.userID).subscribe(()=>{
            this.router.navigate(['/compra-exitosa']);
          })
      }, err =>{
        this.presentAlert('¡Ups! Algo salió mal')
      })  
    }else{
      this.presentAlert('Todos los campos son requeridos')
    }


      
    
    
    //Google Map

    /*
    const coordinates = await Geolocation.getCurrentPosition();
    this.coords = coordinates.coords;

    if(this.user.metodo && this.user.referencia && this.user.tienda && this.user.ubicacion){

      this.storage.get('SET_CART').then((res:any)=>{

        this.userID = localStorage.getItem('userId');
        
      });

    }else{
      
    }
    */
  }

  async presentAlert(msj) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Alerta',
      message: msj,
      buttons: ['OK']
    });

    await alert.present();
  }

}