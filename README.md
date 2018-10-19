# angular-template
## create a new application
```
$ docker-compose up --detach
$ docker-compose exec angular /bin/sh
> cd ../
> ng new myapp
> exit
```

## serve the application
```
$ docker-compose up --detach
$ docker-compose exec angular ng serve --host 0.0.0.0
```
