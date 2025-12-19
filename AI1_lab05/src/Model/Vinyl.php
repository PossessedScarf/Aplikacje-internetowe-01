<?php
namespace App\Model;

use App\Service\Config;

class Vinyl
{
    private ?int $id = null;
    private ?string $title = null;
    private ?string $description = null;
    private ?string $price = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): Vinyl
    {
        $this->id = $id;

        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): Vinyl
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): Vinyl
    {
        $this->description = $description;

        return $this;
    }

    public function getPrice(): ?string
    {
        return $this->price;
    }

    public function setPrice(?string $price): Vinyl
    {
        $this->price = $price;

        return $this;
    }

    public static function fromArray($array): Vinyl
    {
        $vinyl = new self();
        $vinyl->fill($array);

        return $vinyl;
    }

    public function fill($array): Vinyl
    {
        if (isset($array['id']) && ! $this->getId()) {
            $this->setId($array['id']);
        }
        if (isset($array['title'])) {
            $this->setTitle($array['title']);
        }
        if (isset($array['description'])) {
            $this->setDescription($array['description']);
        }
        if (isset($array['price'])) {
            $this->setPrice($array['price']);
        }

        return $this;
    }

    public static function findAll(): array
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $sql = 'SELECT * FROM vinyl';
        $statement = $pdo->prepare($sql);
        $statement->execute();

        $vinyls = [];
        $vinylsArray = $statement->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($vinylsArray as $vinylArray) {
            $vinyls[] = self::fromArray($vinylArray);
        }

        return $vinyls;
    }

    public static function find($id): ?Vinyl
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $sql = 'SELECT * FROM vinyl WHERE id = :id';
        $statement = $pdo->prepare($sql);
        $statement->execute(['id' => $id]);

        $vinylArray = $statement->fetch(\PDO::FETCH_ASSOC);
        if (! $vinylArray) {
            return null;
        }
        $vinyl = Vinyl::fromArray($vinylArray);

        return $vinyl;
    }

    public function save(): void
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        if (! $this->getId()) {
            $sql = "INSERT INTO vinyl (title, description, price) VALUES (:title, :description, :price)";
            $statement = $pdo->prepare($sql);
            $statement->execute([
                'title' => $this->getTitle(),
                'description' => $this->getDescription(),
                'price' => $this->getPrice(),
            ]);

            $this->setId($pdo->lastInsertId());
        } else {
            $sql = "UPDATE vinyl SET title = :title, description = :description, price = :price WHERE id = :id";
            $statement = $pdo->prepare($sql);
            $statement->execute([
                ':title' => $this->getTitle(),
                ':description' => $this->getDescription(),
                ':price' => $this->getPrice(),
                ':id' => $this->getId(),
            ]);
        }
    }

    public function delete(): void
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $sql = "DELETE FROM vinyl WHERE id = :id";
        $statement = $pdo->prepare($sql);
        $statement->execute([
            ':id' => $this->getId(),
        ]);

        $this->setId(null);
        $this->setTitle(null);
        $this->setDescription(null);
        $this->setPrice(null);
    }
}
