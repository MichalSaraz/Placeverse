export default defineNuxtRouteMiddleware((to, from) => {
    const previousRoute = useState('previousRoute', () => '/');
    previousRoute.value = from.fullPath;
});
