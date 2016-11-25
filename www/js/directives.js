angular.module('transportMe.directives', [])

.directive('scrollIf', function ($ionicScrollDelegate) {
  return function (scope, element, attributes) {
    setTimeout(function () {
      if (scope.$eval(attributes.scrollIf)) {
        $ionicScrollDelegate.scrollTo(0, element[0].offsetTop - 100, true);
      }
    });
  }
});