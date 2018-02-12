class DashboardCtrl {
    constructor($scope, uiConfig, $stateParams, rolesFactory) {
        'ngInject';
        $scope.roles = rolesFactory;
        var defaultDashboard = {};

        function getDashboard() {
            return uiConfig.getDashboard($stateParams.id);
        }

        uiConfig.whenReady().then(() => {
            $scope.$watch(getDashboard, newDashboard => {
                $scope.dashboard = newDashboard;
            });
        });

        $scope.addWidget = () => {
            $scope.dashboard.widgets.push(uiConfig.addWidget());
        };

        $scope.removeWidget = (widget) => {
            if (confirm("Really delete widget from dashboard?"))
                $scope.dashboard.removeWidgetFromDashboard(widget);
        };

        $scope.deleteWidget = (widget) => {
            if (confirm("Really delete the widget?"))
                uiConfig.deleteWidget(widget);
        };

    }
}

//-----------------------------------------------------------------------------
export default angular
    .module('homeuiApp.dashboard', [])
    .controller('DashboardCtrl', DashboardCtrl);
