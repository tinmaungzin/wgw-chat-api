terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "2.12.2"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# Define a Docker network
resource "docker_network" "chat_network" {
  name = "chat_network"
}

# RabbitMQ setup
resource "docker_image" "rabbitmq" {
  name = "rabbitmq:3-management"
}

resource "docker_container" "rabbitmq" {
  image = docker_image.rabbitmq.latest
  name  = "rabbitmq"
  ports {
    internal = 5672
    external = 5672
  }
  ports {
    internal = 15672
    external = 15672
  }
  env = [
    "RABBITMQ_DEFAULT_USER=user",
    "RABBITMQ_DEFAULT_PASS=password",
  ]
  healthcheck {
    test     = ["CMD", "rabbitmqctl", "status"]
    interval = "30s"
    timeout  = "10s"
    retries  = 5
  }
  # Attach the container to the created network
  networks_advanced {
    name = docker_network.chat_network.name
  }
}

# Chat API setup
resource "docker_image" "chat_api" {
  name = "chat-api"
  build {
    path = "."
  }
}

resource "docker_container" "chat_api" {
  image = docker_image.chat_api.latest
  name  = "chat_api"
  ports {
    internal = 3000
    external = 3000
  }
  env = [
    "RABBITMQ_URI=amqp://user:password@rabbitmq:5672",
  ]
  # Attach the container to the created network
  networks_advanced {
    name = docker_network.chat_network.name
  }
}
