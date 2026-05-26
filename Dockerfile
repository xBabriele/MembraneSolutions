FROM php:8.2-apache

# Install PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Enable rewrite
RUN a2enmod rewrite
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Copy ONLY the website folder → becomes the web root
COPY website/ /var/www/html/

RUN chmod -R 755 /var/www/html

# Port config for Railway
RUN echo 'Listen ${PORT}' > /etc/apache2/ports.conf && \
    sed -i 's/VirtualHost \*:80/VirtualHost *:${PORT}/' /etc/apache2/sites-enabled/000-default.conf

EXPOSE 8080

# Fix MPM at runtime (not build time) then start Apache
CMD bash -c "\
    find /etc/apache2/mods-enabled/ -name 'mpm_*' -delete && \
    ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load && \
    ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf && \
    apache2-foreground"

RUN echo "<?php phpinfo();" > /var/www/html/info.php