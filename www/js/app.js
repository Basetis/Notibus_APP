var app = angular.module(
  'transportMe',
  [
    'ionic',
    'transportMe.controllers',
    'transportMe.directives',
    'transportMe.services',
    'ionic.utils',
    'angularSoap',
    'ngCordova',
    'pascalprecht.translate'
  ]
)
.run(function($ionicPlatform, $translate, $ionicPopup) {
  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    // Select App language
    if (typeof navigator.globalization !== "undefined") {
      navigator.globalization.getPreferredLanguage(
        function (language) {
          var deviceLang = (language.value).split("-")[0];
          if (deviceLang !== 'es' && deviceLang !== 'ca' && deviceLang !== 'en') {
            deviceLang = 'es';
          }
          app.language = deviceLang;

          $translate.use(deviceLang).then(function(data) {
            // ok
          }, function(error) {
            // error
            console.log(error);
          });
        },
        function () {}
      );
    }

    // Check connection
    var connectionType = (navigator.connection) ? navigator.connection.type : undefined;

    if (connectionType == "none") {
      $translate("no_connection_error").then(function (no_connection_error) {
        $ionicPopup.alert({
          title: 'Error',
          content: no_connection_error
        }).then(function(res) {
          // ..
        });
      });
    }
  });
});

app.routeTimeout;
app.watchId = null;


app.getDistanceFromCoordsInKm = function(origin, destination) {
    return app.getDistanceFromLatLonInKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
  };
app.getDistanceFromLatLonInKm = function(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = app.deg2rad(lat2 - lat1); // deg2rad below
    var dLon = app.deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(app.deg2rad(lat1)) * Math.cos(app.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
  };

app.deg2rad = function(deg) {
    return deg * (Math.PI / 180);
  };

app.config(function($stateProvider, $urlRouterProvider, $translateProvider) {

  $stateProvider
    .state('origin', {
      url: '/',
      templateUrl: 'templates/origin.html',
      controller: 'OriginCtrl'
    })
    .state('destination', {
      url: '/destination',
      templateUrl: 'templates/destination.html',
      controller: 'DestinationCtrl'
    })
    .state('notifications', {
      url: '/notifications',
      templateUrl: 'templates/notifications.html',
      controller: 'NotificationsCtrl'
    })
    .state('about', {
      url: '/about',
      templateUrl: 'templates/about.html',
      controller: 'AboutCtrl'
    })
    .state('promo', {
      url: '/promo',
      templateUrl: 'templates/promo.html',
      controller: 'PromoCtrl'
    })
    .state('route', {
      url: '/route',
      templateUrl: 'templates/route.html',
      controller: 'RouteCtrl'
    });

  $urlRouterProvider.otherwise("/");

  // Translation literals

  // Spanish
  $translateProvider.translations('es', {
    back_message: 'Atrás',
    to_message: 'Hacia',
    no_nearby_stops: 'No hay paradas cercanas',
    no_connection_error: 'No hay conexión de datos',
    my_bus_message: 'NOTIBUS',
    my_destination_message: 'MI DESTINO',
    my_notifications_message: 'MIS AVISOS',
    my_route_message: 'MI RUTA',
    select_destination_stop_message: 'Selecciona la parada destino',
    destination_stop: 'Parada de destino',
    stop_number_or_name_message: 'Número o nombre de parada...',
    how_do_you_want_us_to_notify_you_message: 'Puedes personalizar la notificación añadiendo:',
    alert_only_message: 'Sólo alerta',
    vibration_message: 'Vibración',
    sound_alert_message: 'Aviso sonoro',
    when_do_you_want_us_to_notify_you_message: '¿Cuándo quieres que te avisemos?',
    one_stop_before_message: '1 parada antes',
    two_stops_before_message: '2 paradas antes',
    three_stops_before_message: '3 paradas antes',
    accept_button_message: 'ACEPTAR',
    no_results_found_message: 'No hay resultados',
    you_should_activate_notifications_in_your_phone_message: 'Debes activar las notificaciones en tu dispositivo para recibir avisos.',
    click_here_to_show_your_location_message: 'Haz click aquí para mostrar tu ubicación',
    click_here_to_see_the_entire_route_message: 'Haz click aquí para visualizar toda la ruta',
    you_need_to_select_a_subsequent_stop_message: 'Debes seleccionar una parada posterior.',
    origin_page_message: 'Pantalla origen',
    destination_page_message: 'Pantalla destino',
    notifications_page_message: 'Pantalla notificaciones',
    route_page_message: 'Pantalla ruta definida',
    notifications_message: 'AVISOS',
    cancel_route_message: 'CANCELAR',
    you_have_arrived_at_your_destination_message: 'Has llegado a tu destino. Puedes bajar.',
    you_are_n_stops_from_destination_message: 'Estás a {{stops}} parada(s) de tu destino',
    warning: 'Aviso',
    you_need_to_activate_your_gps_to_use_the_app_message: 'Debes activar tu GPS para usar la aplicación.',
    geolocation_access_denied_message: 'Se ha denegado el acceso a la geolocalización',
    could_not_determine_current_position_message: 'No se ha podido determinar la posición actual',
    you_need_to_activate_your_gps_or_it_has_lost_signal_message: 'Debes activar tu GPS o éste ha perdido la señal',
    loading: 'Cargando...',
    you_are_on_route_message: 'Estás en ruta',
    searching_bus_stops: 'Buscando paradas cercanas...',
    you_are_going_to_cancel_your_route_message: 'Te dispones a cancelar la ruta',
    contact_us: '¿Alguna sugerencia? ¿Algún problema? ¡Te ayudaremos!',
    contact: 'Contacta',
    cancel: 'Cancela',
    write: 'Escribe',
    about_title: 'ACERCA',
    about: 'Acerca de nosotros',
    about_long_text_1: "BaseTIS es un equipo de personas dentro del ámbito de las tecnologías de la información. Los 4 valores que nos definen son: iniciativa, trabajo en equipo, compromiso y orientación a objetivos.",
    about_long_text_2: "En BaseTIS ofrecemos servicios adaptándonos a las necesidades de nuestros clientes y con una clara orientación a objetivos. Somos flexibles tanto tecnológica como funcionalmente aportando experiencia y capacidad de gestión.",
    about_long_text_3: "La tecnología de la información nos apasiona, y en consecuencia trabajamos para aprender mediante proyectos internos. Esto nos aporta estar alineados con las necesidades de tecnología puntera que puedan requerir nuestros clientes.",
    about_transportme: "Acerca de Notibus",
    about_transportme_long_text: "Esta App nace con la intención de ayudarte en los desplazamientos en transporte público, esperamos que sea de tu agrado y no dudes en contactarnos por cualquier duda, mejora o problema que quieras comunicarnos en notibus.suport@gmail.com",
    thanks_title: "Agradecimientos",
    thanks_long_text: "Queremos dar las gracias a todas las personas que han hecho que este proyecto fuera posible. Idea Concept: Albert Mialet, Didac Zurita, Jesús Coll y Rubén Fernández. Developers: Diyan Krasimirov, Dani Granados, Thais Martinez, Andoni Garmendia, José Luis Vidal. QA: Gabriel Botana. UI & UX Design: Stella Belmonte. Management: Thais Martinez, CTO: Ruben Fernández, BaseTIS CEO: Marc Castells",
    thanks_long_text2: "Y especialmente, muchas gracias a ti. Gracias por usar nuestra App.",
    mail_title: "Notibus - Soporte",
    about_tmb: "Sobre los datos",
    about_tmb_long_text: "Los datos de las paradas y rutas de los autobuses así como los tiempos de llegada previstos se obtienen de TMB – TRANSPORTS METROPOLITANS DE BARCELONA en tiempo real",
    about_property: "Propiedad Intelectual",
    about_property_long_text: "Todos los derechos de las imágenes mostradas en esta aplicación están reservados por sus correspondientes propietarios legales. Las imágenes son marcas registradas o copyright de BaseTIS. Los elementos pertenecen a BaseTIS y no pueden ser reproducidos total ni parcialmente en ningún soporte o formato a menos que cuente con la autorización expresa de los mismos.",
    share_love_message: 'Gracias a @notibusapp he bajado en la parada correcta',
    share_love_subject: 'Notibus',
    contact_promo_message: 'Más información',
    promo_title: 'TURISMO',
    contact_promo: "Notibus - Turismo",
    contact_promo_long_text: "Buscamos colaboradores que puedan servir contenidos de interés a nuestros usuarios, contáctanos",
    contact_promo_img: 'img/promo_es.png'
  });

  // Catalan
  $translateProvider.translations('ca', {
    back_message: 'Enrere',
    to_message: 'Cap a',
    no_nearby_stops: 'No hi ha parades properes',
    no_connection_error: 'No hi ha connexió de dades',
    my_bus_message: 'NOTIBUS',
    my_destination_message: 'EL MEU DESTÍ',
    my_notifications_message: 'ELS MEUS AVISOS',
    my_route_message: 'LA MEVA RUTA',
    select_destination_stop_message: 'Selecciona la parada destí',
    destination_stop: 'Parada de destí',
    stop_number_or_name_message: 'Número o nom de parada...',
    how_do_you_want_us_to_notify_you_message: 'Pots personalitzar la notificació afegint:',
    alert_only_message: 'Només alerta',
    vibration_message: 'Vibració',
    sound_alert_message: 'Avís sonor',
    when_do_you_want_us_to_notify_you_message: 'Quan vols que t\'avisem?',
    one_stop_before_message: '1 parada abans',
    two_stops_before_message: '2 parades abans',
    three_stops_before_message: '3 parades abans',
    accept_button_message: 'ACCEPTAR',
    no_results_found_message: 'No hi ha resultats',
    you_should_activate_notifications_in_your_phone_message: 'Has d\'activar les notificacions en el teu dispositiu per poder rebre avisos.',
    click_here_to_show_your_location_message: 'Fes click aquí per a mostrar la teva ubicació',
    click_here_to_see_the_entire_route_message: 'Fes click aquí per a visualitzar tota la ruta',
    you_need_to_select_a_subsequent_stop_message: 'Has de seleccionar una parada posterior.',
    origin_page_message: 'Pantalla origen',
    destination_page_message: 'Pantalla destí',
    notifications_page_message: 'Pantalla notificacions',
    route_page_message: 'Pantalla ruta definida',
    notifications_message: 'AVISOS',
    cancel_route_message: 'CANCEL·LAR',
    you_have_arrived_at_your_destination_message: 'Has arribat al teu destí. Pots baixar.',
    you_are_n_stops_from_destination_message: 'Estàs a {{stops}} parada(es) del teu destí',
    warning: 'Avís',
    you_need_to_activate_your_gps_to_use_the_app_message: 'Has d\'activar el teu GPS per poder utilitzar l\'aplicació.',
    geolocation_access_denied_message: 'S\'ha denegat l\'accés a la geolocalització',
    could_not_determine_current_position_message: 'No s\'ha pogut determinar la posició actual',
    you_need_to_activate_your_gps_or_it_has_lost_signal_message: 'Has d\'activar el teu GPS o aquest ha perdut el senyal',
    loading: 'Carregant...',
    you_are_on_route_message: 'Estàs en ruta',
    searching_bus_stops: 'Cercant parades properes...',
    you_are_going_to_cancel_your_route_message: 'Et disposes a cancel·lar la ruta',
    contact_us: 'Algun suggeriment? Algun problema? T\'ajudarem!',
    contact: 'Contacta',
    cancel: 'Cancel·la',
    write: 'Escriu',
    about_title: 'SOBRE',
    about: 'Sobre nosaltres',
    about_long_text_1: "BaseTIS és un equip de persones dins de l'àmbit de les tecnologies de la informació. Els 4 valors que ens defineixen són: iniciativa, treball en equip, compromís i orientació a objectius.",
    about_long_text_2: "A BaseTIS oferim serveis adaptant-nos a les necessitats dels nostres clients i amb una clara orientació a objectius. Som flexibles tant tecnològica com funcionalment aportant experiència i capacitat de gestió.",
    about_long_text_3: "La tecnologia de la informació ens apassiona, i en conseqüència treballem per aprendre mitjançant iniciatives internes. A més a més, aquesta proactivitat ens aporta estar alineats amb les necessitats de tecnologia capdavantera que puguin requerir els nostres clients.",
    about_transportme: "Sobre Notibus",
    about_transportme_long_text: "Aquesta App neix amb la intenció d'ajudar-te en els desplaçaments en transport públic, esperem que sigui del teu gust i no dubtis en contactar-nos per a qualsevol dubte, millora o problema que vulguis resoldre a notibus.suport@gmail.com",
    thanks_title: "Agraïments",
    thanks_long_text: "Volem donar les gràcies a totes les persones que han fet que aquest projecte sigui possible.  Idea Concept: Albert Mialet, Didac Zurita, Jesús Coll y Rubén Fernández. Developers: Diyan Krasimirov, Dani Granados, Thais Martinez, Andoni Garmendia, José Luis Vidal. QA: Gabriel Botana. UI & UX Design: Stella Belmonte. Management: Thais Martinez, CTO: Ruben Fernández, BaseTIS CEO: Marc Castells",
    thanks_long_text2: "I especialment, moltes gracies a tu. Gràcies per fer servir la nostra App.",
    mail_title: "Notibus - Suport",
    about_tmb: "Sobre les dades",
    about_tmb_long_text: "Les dades de parades, rutes d'autobusos així com els temps previstos d'arribada s'obtenen de TMB – TRANSPORTS METROPOLITANS DE BARCELONA en temps real",
    about_property: "Propietat Intel·lectual",
    about_property_long_text: "Tots els drets de les imatges mostrades en aquesta aplicació estan reservats pels seus corresponents propietaris legals. Les imatges són marques registrades o copyright de BaseTIS. Els elements pertanyen a BaseTIS i no poden ser reproduïts totalment ni parcialment en cap suport o format llevat que compti amb l'autorització expressa dels mateixos.",
    share_love_message: "Gràcies a @notibusapp m'he baixat del bus a la parada correcta",
    share_love_subject: 'Notibus',
    contact_promo_message: "Més informació",
    promo_title: 'TURISME',
    contact_promo: "Notibus - Turisme",
    contact_promo_long_text: "Cerquem col·laboradors que puguin servir continguts d'interés als nostres usuaris, contacta'ns",
    contact_promo_img: 'img/promo_ca.png'
  });

  // English
  $translateProvider.translations('en', {
    back_message: 'Back',
    to_message: 'To',
    no_nearby_stops: 'There are no nearby stops',
    no_connection_error: 'There is no data connection',
    my_bus_message: 'NOTIBUS',
    my_destination_message: 'MY DESTINATION',
    my_notifications_message: 'MY NOTIFICATIONS',
    my_route_message: 'MY ROUTE',
    select_destination_stop_message: 'Select the destination stop',
    destination_stop: 'Bus stop destination',
    stop_number_or_name_message: 'Stop number or name...',
    how_do_you_want_us_to_notify_you_message: 'You can customize the notification adding:',
    alert_only_message: 'Alert only',
    vibration_message: 'Vibration',
    sound_alert_message: 'Sound alert',
    when_do_you_want_us_to_notify_you_message: 'When do you want us to notify you?',
    one_stop_before_message: '1 stop before',
    two_stops_before_message: '2 stops before',
    three_stops_before_message: '3 stops before',
    accept_button_message: 'ACCEPT',
    no_results_found_message: 'No results found',
    you_should_activate_notifications_in_your_phone_message: 'You need to enable notifications in your device in order to receive alerts.',
    click_here_to_show_your_location_message: 'Click here to show your location',
    click_here_to_see_the_entire_route_message: 'Click here to see the entire route',
    you_need_to_select_a_subsequent_stop_message: 'You must select a subsequent stop.',
    origin_page_message: 'Origin page',
    destination_page_message: 'Destination page',
    notifications_page_message: 'Notifications page',
    route_page_message: 'Defined route page',
    notifications_message: 'NOTIFICATIONS',
    cancel_route_message: 'CANCEL',
    you_have_arrived_at_your_destination_message: 'You have arrived at your destination. You can get off.',
    you_are_n_stops_from_destination_message: 'You are {{stops}} stop(s) from your destination',
    warning: 'Warning',
    you_need_to_activate_your_gps_to_use_the_app_message: 'You need to activate the GPS in order to use the application.',
    geolocation_access_denied_message: 'Access denied when using geolocation',
    could_not_determine_current_position_message: 'Couldn\'t determine the current position',
    you_need_to_activate_your_gps_or_it_has_lost_signal_message: 'Your GPS is not activated or it has lost the signal',
    loading: 'Loading...',
    you_are_on_route_message: 'You are on route',
    searching_bus_stops: 'Looking for nearby Bus Stops...',
    you_are_going_to_cancel_your_route_message: 'You are going to cancel the route',
    contact_us: 'Any request? Any problem? We will help you!',
    contact: 'Contact',
    cancel: 'Cancel',
    write: 'Write',
    about_title: 'ABOUT',
    about: 'About us',
    about_long_text_1: "BaseTIS is a team of people in the Information Technologies area. Our core values are: initiative, team work, commitment and goals orientation.",
    about_long_text_2: "BaseTIS offers services adapted to our clients' needs and with a clear focus on results. We are both technologically and functionally flexible, with high expertise and management capacity.",
    about_long_text_3: "We are passionate about the information technologies and therefore we learn by working with internal projects. This helps us be up-to-date with the cutting-edge technology needs of our clients.",
    about_transportme: "About Notibus",
    about_transportme_long_text: "This App is intended to help you commuting in public transport, we hope you like it and don't hesitate to contact us to notibus.suport@gmail.com to solve any doubt, problem or send us feedback.",
    thanks_title: "Thanks",
    thanks_long_text: "We want to thank you all the people that make this project happen. Idea Concept: Albert Mialet, Didac Zurita, Jesús Coll y Rubén Fernández. Developers: Diyan Krasimirov, Dani Granados, Thais Martinez, Andoni Garmendia, José Luis Vidal. QA: Gabriel Botana. UI & UX Design: Stella Belmonte. Management: Thais Martinez, CTO: Ruben Fernández, BaseTIS CEO: Marc Castells",
    thanks_long_text2: "Specially, thank you very much to you. Thanks for use our App.",
    mail_title: "Notibus - Support",
    about_tmb: "About data",
    about_tmb_long_text: "Bus Stop, Bus Routes and expected Arrival Times are obtained from TMB – TRANSPORTS METROPOLITANS DE BARCELONA in realtime",
    about_property: "Intellectual Property",
    about_property_long_text: "All rights to the images shown in this application are reserved by their respective legal owners. Images are trademarks or copyright of BaseTIS. The items belong to BaseTIS and may not be reproduced in whole or in part, in any medium or format unless you have the express written permission of the same.",
    share_love_message: 'Thanks to @notibusapp I get off the bus at the right stop',
    share_love_subject: 'Notibus',
    contact_promo_message: "More info",
    promo_title: 'TOURISM',
    contact_promo: "Notibus - Tourism",
    contact_promo_long_text: "We are looking for partners that can serve relevant content to our users, contact us",
    contact_promo_img: 'img/promo_en.png'

  });
  $translateProvider.preferredLanguage('ca');
});