<?php

/** @var \App\Model\Vinyl[] $vinyls */
/** @var \App\Service\Router $router */

$title = 'Vinyl List';
$bodyClass = 'index';

ob_start(); ?>
    <h1>Vinyls List</h1>

    <a href="<?= $router->generatePath('vinyl-create') ?>">Create new</a>

    <ul class="index-list">
        <?php foreach ($vinyls as $vinyl): ?>
            <li><h3><?= $vinyl->getTitle() ?></h3>
                <h4> Price: <?= $vinyl->getPrice() ?></h4>
                <ul class="action-list">
                    <li><a href="<?= $router->generatePath('vinyl-show', ['id' => $vinyl->getId()]) ?>">Details</a></li>
                    <li><a href="<?= $router->generatePath('vinyl-edit', ['id' => $vinyl->getId()]) ?>">Edit</a></li>
                </ul>
            </li>
        <?php endforeach; ?>
    </ul>

<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
