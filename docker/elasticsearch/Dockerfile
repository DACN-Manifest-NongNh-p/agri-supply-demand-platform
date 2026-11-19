ARG ES_VERSION=8.17.0

# Elasticsearch has no Vietnamese analyzer; ICU folding lets "đơn hàng" match "don hang".
FROM docker.elastic.co/elasticsearch/elasticsearch:${ES_VERSION}
RUN bin/elasticsearch-plugin install --batch analysis-icu
