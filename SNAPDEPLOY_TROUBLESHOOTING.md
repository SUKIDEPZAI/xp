# SnapDeploy deployment fix

The reported log shows `PORT=80` and `EACCES`. SnapDeploy containers run as an unprivileged user, so Node cannot bind to privileged ports below 1024.

1. Deploy this source revision (package version `0.4.4`), not the older `0.3.0` checkout.
2. In SnapDeploy container/network settings, set the application/container listening port to `8080`.
3. Remove any custom `PORT=80` override if the dashboard allows it. `PORT` is normally platform-managed; the platform's configured container port must be 8080.
4. Keep the start command as `npm start`. The server binds to `0.0.0.0` and reads the injected `PORT`.
5. Use `/health` for process liveness. Use `/ready` only when a database is configured and database readiness is required.

Expected startup log:

```text
> windows-xp-living-desktop@0.4.4 start
XP Living Desktop listening on http://0.0.0.0:8080
```

If the next deployment still logs version `0.4.4` or `PORT=80`, it is not using this source revision or the container port setting has not been updated. Do not work around this by silently changing the app to listen on 8080 while the platform routes to port 80; both ports must match.
